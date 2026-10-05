// LAW-0248 — Preparación de demanda · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens holds a second copy of the stage at the
// SAME coordinates, zoomed onto the inspected section), the change is localized (only the inspected section's piece)
// and seeking back restores the previous datum exactly.
// Windows (u): lens opens 0.20–0.32 (copy text and the card's old value legible from u ≈ 0.256, in step with the
// context copy of the datum going blank 0.244–0.2555) · strike 0.44–0.49 · lens geometry 0.48–0.58 · new value
// 0.555–0.585 (still to 0.66) · text out 0.66–0.68 · lens closes 0.675–0.72 (context text back 0.683–0.692) · context
// change 0.74–0.80 · marker and note 0.82–0.88 (hold from 0.88).
// Square and wide frames where the window would cover most of the context use a stepped-back context: it shrinks
// (0.235–0.33) into a top band (stack) or the left part (aside), >= 0.47 of the frame width, its texts out first, and
// grows back 0.62–0.675 before the lens closes.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, TEXT_OFF_BARS, NEUTRAL_MARKERS, textSizeOverTime, baselineTextAtHold,
  HEADS_OFF_TEXT, labelsOffProps, contentShare, coverageOverTime, playedVsSeek, coldCreate,
  NO_SPLIT_TOKENS, LEADS_WITH_CHIPS,
} from './preparacion-demanda-checks.js';

const ID = 'LAW-0248';
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];
const ALT = presetsFor(ID).find(q => q.name === 'contrast-or-alternative').params;
const CONTENT = ['st-pa', 'st-frame', 'st-sheet', 'st-trays', 'st-cfg', 'st-cal', 'st-counter', 'st-wall', 'lens-win', 'note'];
const PROPS = ['st-pa', 'st-pa-nw', 'st-frame', 'st-sheet', 'st-trays', 'st-lips', 'st-card0', 'st-card1', 'st-card2', 'st-cfg', 'st-cal', 'st-counter'];

contractSuite(ID, {
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextDatum === 'before' && s.markerShown === 0 && s.pieceInSlotCtx && s.contextDatumTextShown === 1", label: 'context: the assembled filing, old datum, nothing marked'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.zoom >= 1.5 && s.oldShown === 1 && s.datum === 'before' && s.sourceInContext && s.lensClearOfFaces && s.contextDatumTextShown === 0", label: 'isolate: a real 1.5×+ lens, old value shown; the context copy of the datum is blank'},
    {at: 0.4, fn: "s.ctxShare >= 0.45 && (s.contextScale === 1 || ['stack', 'aside'].includes(s.placement))", label: 'while the lens is open at least 0.45 of the frame shows context (a stepped-back context only in the stack / aside layouts)'},
    {at: 0.47, fn: "s.strike > 0 && s.datum === 'before' && s.contextDatum === 'before'", label: 'the old value is struck before anything changes'},
    {at: 0.62, fn: "s.datum === 'after' && s.newShown === 1 && s.strike === 1 && s.contextDatum === 'before' && !s.pieceInSlotLens && s.pieceInSlotCtx", label: 'substitute inside the lens only: the piece has left the slot in the copy, the context is unchanged'},
    {at: 0.74, fn: 's.lensOpen === 0 && s.contextDatumTextShown === 1 && s.contextScale === 1', label: 'the lens has closed, the context is back at full size (and its text is back) before the context changes'},
    {at: 0.1, fn: 's.contextScale === 1', label: 'the context fills the frame at full size at rest'},
    {at: 1, fn: "s.contextDatum === 'after' && !s.pieceInSlotCtx && s.markerShown === 1 && s.noteShown === 1 && s.allReached && s.truncated.length === 0 && s.labelsClear && s.fitted", label: 'return: context updated, Δ marker and before/after note, nothing cut, fitted'},
    {at: 0.3, fn: "s.datum === 'before' && s.contextDatum === 'before' && s.strike === 0 && s.newShown === 0 && s.pieceInSlotLens", label: 'seeking back restores the old datum exactly'},
    {at: 1, params: ALT, fn: "s.focusSection === 1 && !s.pieceInSlotCtx && s.contextDatum === 'after'", label: 'alternative: the requests section is the one inspected and changed'},
    {at: 0.62, params: {textVisibility: 'none'}, fn: "s.datum === 'after' && s.lensOpen === 1", label: 'labels hidden: the same isolation and substitution'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.parties[0].name, p.parties[1].name, p.parties[0].role, p.documents.caseFile.ref, p.documents.caseFile.title, p.documents.filing.ref, p.documents.filing.title, ...p.sections.map(s => s.heading), ...p.sections.filter((s, i) => i !== ['section1','section2','section3'].indexOf(p.focusTarget)).map(s => s.item), p.dates.filing, p.dates.calendar, p.labels.calendar, p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

// rendered: the open lens window's SMALLER side over the frame's short side (AUTHORING 109: >= 0.35), the context
// left in view — not under the window — over the frame (>= 0.45 of its width, or of its height), on the drawn window and stage
const LENS_LARGE = `(() => {
  const vb = svg.viewBox.baseVal, m = svg.getScreenCTM();
  const p0 = new DOMPoint(vb.x, vb.y).matrixTransform(m), p1 = new DOMPoint(vb.x + vb.width, vb.y + vb.height).matrixTransform(m);
  const FW = p1.x - p0.x, FH = p1.y - p0.y;
  const w = svg.querySelector('[data-node="lens-bg"]').getBoundingClientRect();
  const bs = ['st-pa', 'st-frame', 'st-cal'].map(n => svg.querySelector('[data-node="' + n + '"]').getBoundingClientRect());
  const L0 = Math.min(...bs.map(b => b.left)), R0 = Math.max(...bs.map(b => b.right)), T0 = Math.min(...bs.map(b => b.top)), B0 = Math.max(...bs.map(b => b.bottom));
  // the context left in view: its drawn width (height) minus what the window covers across it
  const ovX = Math.max(0, Math.min(R0, w.right) - Math.max(L0, w.left)), ovY = Math.max(0, Math.min(B0, w.bottom) - Math.max(T0, w.top));
  const visW = (R0 - L0) - (ovY > 0.35 * (B0 - T0) ? ovX : 0), visH = (B0 - T0) - (ovX > 0.35 * (R0 - L0) ? ovY : 0);
  return Math.min(w.width, w.height) >= 0.35 * Math.min(FW, FH) && Math.max(visW / FW, visH / FH) >= 0.45;
})()`;
// rendered magnification against the context AT REST: a text of the enlarged copy over the same text in the context
// (labels hidden: the enlarged copy's frame against the context's frame)
const MAGNIFICATION = `(() => {
  const k = (t) => { const m = t.getScreenCTM(); return Math.hypot(m.a, m.b); };
  const c = [...svg.querySelectorAll('[data-node="lens-content"] text')].find(t => t.textContent.trim());
  if (c) {
    const o = svg.querySelector('[data-node="' + c.getAttribute('data-node').replace(/^lz-/, 'st-') + '"]');
    return Boolean(o) && k(c) / k(o) >= 1.5;
  }
  const a = svg.querySelector('[data-node="lz-frame"]'), b = svg.querySelector('[data-node="st-frame"]');
  return Boolean(a && b) && k(a) / k(b) >= 1.5;
})()`;
ratioChecks(ID, 'lens checklist, faces, frame, people', [
  {at: [0, 0.5, 1], dom: NO_SPLIT_TOKENS, label: 'RENDERED: no reference or word is broken across lines (no hyphen break, no 1–2 character line)'},
  {at: [0.3, 1], tv: ['all'], presets: ['baseline-illustrative'], params: {locale: 'es'}, dom: "(() => { const t = [...svg.querySelectorAll('text')].map(x => x.textContent).join(' '); return !/Party A|Party B|Case file|Written claim|Delivery note|as supplied|Only whether|Every piece|Filing complete|Section to complete|The filing as assembled|Changed datum/.test(t) && /Parte A|Expediente/.test(t); })()", label: 'with only locale "es", every default text is shown in Spanish (no English default remains)'},
  {at: times(0.2, 0.74, 0.02), fn: "s.lensClearOfFaces && (s.contextScale === 1 || ['stack', 'aside'].includes(s.placement))", label: 'the lens never covers a face; the context stays at full size (dimmed while the lens is open) — or, in the stacked / aside layouts, steps back to make room'},
  {at: [0.42, 0.5, 0.58], dom: LENS_LARGE, label: 'RENDERED: the open lens window’s smaller side >= 0.35 of the frame’s short side; the context left in view (not under the window) >= 0.45 of the frame'},
  {at: [0.4, 0.5, 0.6], dom: MAGNIFICATION, label: 'RENDERED: magnification >= 1.5× against the same text in the context at rest'},
  {at: [0.34, 0.45, 0.55, 0.64], fn: 's.zoom >= 1.5 && s.sourceInContext && s.cardInWindow', label: 'zoom >= 1.5×, source in the context, the datum card wholly in the window'},
  {at: [0.34, 0.5, 0.64], fn: 's.guidesOnSource', label: 'guides start on the inspected section'},
  {at: [0.59, 0.62, 0.65], tv: ['all'], fn: 's.newShown === 1 && s.lensOpen === 1', label: 'the new value is still for >= 400 ms'},
  {at: [1], fn: 's.markerClearOfFaces && s.markerShown === 1', label: 'the Δ marker is clear of faces'},
  {at: [0, 0.3, 0.5, 0.65, 1], dom: FACES_CLEAR, label: 'no chip, note or lens covers a head'},
  {at: [0, 0.4, 0.62, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02)'},
  {at: [1], dom: headsAtLeast(52), label: 'people large in the context (head >= 52 px at 1080p)'},
  // (AUTHORING 110: an inspect context keeps >= ~45–50 % of the frame width; the upper end is asserted)
  {at: [0, 1], dom: contentShare(['st-pa', 'st-frame', 'st-sheet', 'st-cfg', 'st-cal'], 0.71), label: 'RENDERED: the context stage (person, frame, filing, case file, calendar; not the counter or wall) spans >= 0.71 of the FRAME width at rest and at the hold (full size; it steps back only while the lens is open)'},
  {at: [0, 1], tv: ['all'], dom: labelsOffProps(PROPS), label: 'RENDERED: no chip, note or key lies over a prop, a person or text it does not own (rest and hold)'},
  {at: [0, 0.4, 0.6, 1], dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: times(0, 1, 0.04), dom: HEADS_OFF_TEXT, label: 'RENDERED: no head is drawn over visible text'},
  {at: times(0, 0.47, 0.01), fn: "s.contextDatum === 'before' && s.datum === 'before' && s.pieceInSlotCtx", label: 'before the substitution beat: the old datum in the context and in the lens'},
]);

// Rendered, every 20 ms over the lens phase in every preset × ratio × labels: (1) a bare window (copy under half
// opacity) never lasts more than 200 ms; (2) every text of the enlarged copy is wholly inside the window or wholly
// outside it (no line cut by the rim); (3) the guides cross no face and no visible text.
test(`${ID}: lens — bare card ≤ 200 ms, no text cut by the rim, guides clear (rendered, every 20 ms)`, async ({page}) => {
  test.setTimeout(400000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
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
        const lt = [...q('lens-content').querySelectorAll('text')].filter(t => t.textContent.trim());
        const copy = Math.max(0, ...lt.map(eff));
        if (card && copy < 0.5 && tv === 'all') { run += 20; worst = Math.max(worst, run); } else run = 0;
        if (!card) continue;
        const cp = q('lens-cliprect'), cm = cp.getScreenCTM();
        const c0 = new DOMPoint(+cp.getAttribute('x'), +cp.getAttribute('y')).matrixTransform(cm);
        const c1 = new DOMPoint(+cp.getAttribute('x') + +cp.getAttribute('width'), +cp.getAttribute('y') + +cp.getAttribute('height')).matrixTransform(cm);
        const cr = {left: c0.x, top: c0.y, right: c1.x, bottom: c1.y};
        for (const t of lt) {
          if (eff(t) < 0.05) continue;
          for (const ts of t.querySelectorAll('tspan').length ? t.querySelectorAll('tspan') : [t]) {
            const b = ts.getBoundingClientRect();
            if (b.width < 0.5) continue;
            const over = b.left < cr.right && b.right > cr.left && b.top < cr.bottom && b.bottom > cr.top;
            const inside = b.left >= cr.left - 1 && b.right <= cr.right + 1 && b.top >= cr.top - 1 && b.bottom <= cr.bottom + 1;
            if (over && !inside) cut.push(`${u.toFixed(2)}:${ts.textContent.slice(0, 16)}`);
          }
        }
        const heads = [...svg.querySelectorAll('[data-node$="-pa-head"]')].filter(e => !e.closest('[data-node="lens-content"]')).map(e => e.getBoundingClientRect());
        const sr = q('lens-src').getBoundingClientRect();
        const within = b => b.left >= sr.left - 2 && b.right <= sr.right + 2 && b.top >= sr.top - 2 && b.bottom <= sr.bottom + 2;
        const texts = [...svg.querySelectorAll('text')].filter(t => eff(t) > 0.3 && t.textContent.trim() && !t.closest('[data-node="lens-win"]') && !t.closest('[data-layer="content-notice"]')).map(t => t.getBoundingClientRect()).filter(b => !within(b));
        for (const n of ['lens-cone0', 'lens-cone1']) {
          const l = q(n); if (!l || eff(l) < 0.05) continue;
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
  }, [ALL, ID]);
  for (const r of res) {
    expect.soft(r.worst, `bare lens window run (ms) [${r.k}]`).toBeLessThanOrEqual(200);
    expect.soft(r.cut, `lens copy text cut by the rim [${r.k}]`).toEqual([]);
    expect.soft(r.cross, `lens guides crossing a face or text [${r.k}]`).toEqual([]);
  }
});

// Rendered at 60 fps over the whole animation in every preset × ratio × labels state (AUTHORING 109): (1) the changed
// datum is shown in ONE place at a time — its context copy (the inspected piece's printed text) and the lens copy
// (the enlarged copy's text, the datum card) are never both at >= 0.15 opacity; (2) hand-over gaps on open and close,
// measured on the texts the viewer reads, are <= 200 ms; (3) a window with no legible text never lasts > 200 ms;
// (4) the open window intersects no visible context text (>= 0.15).
test(`${ID}: one copy of the changed datum at a time, hand-over gaps <= 200 ms, no blank window, lens over no visible text (rendered, 60 fps)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
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
      x.seek(0);
      const k = x.getState({bounds: false}).semantic.focusSection;
      const frames = Math.round(x.durationMs / (1000 / 60));
      const both = [], over = [], series = [];
      let bare = 0, bareMax = 0;
      for (let f = 0; f <= frames; f++) {
        const u = f / frames;
        x.seek(u * x.durationMs);
        // the context copy of the datum: the inspected piece's printed text (labels hidden: the piece itself)
        const cardEl = q(`st-card${k}`);
        const ctxTexts = [...svg.querySelectorAll(`[data-node="st-c${k}"] text`)].filter(t => t.textContent.trim());
        const ctxCopy = tv === 'all' ? Math.max(0, ...ctxTexts.map(eff)) : 0;
        const lensTexts = [...svg.querySelectorAll('[data-node="lens-content"] text, [data-node="val-old"] text, [data-node="val-new"] text')].filter(t => (t.textContent || '').trim());
        const lensCopy = Math.max(0, ...lensTexts.map(eff));
        const bg = q('lens-bg');
        const winOn = bg && eff(bg) >= 0.05 && bg.getBoundingClientRect().width > 2;
        bare = winOn && tv === 'all' && lensCopy < 0.15 ? bare + 1 : 0;
        bareMax = Math.max(bareMax, bare);
        series.push([ctxCopy, lensCopy]);
        if (ctxCopy >= 0.15 && lensCopy >= 0.15) both.push(u.toFixed(3));
        if (winOn) {
          const W = bg.getBoundingClientRect();
          for (const t of svg.querySelectorAll('text')) {
            if (t.closest('[data-node="lens-win"], [data-layer="content-notice"]') || eff(t) < 0.15 || !t.textContent.trim()) continue;
            const b = t.getBoundingClientRect();
            if (b.width < 0.5) continue;
            if (b.left < W.right && b.right > W.left && b.top < W.bottom && b.bottom > W.top) { over.push(`${u.toFixed(3)}:${t.textContent.slice(0, 18)}`); break; }
          }
        }
        void cardEl;
      }
      const fm = x.durationMs / frames, L = i => series[i][1] >= 0.15, C = i => series[i][0] >= 0.15;
      let gapOpen = 0, gapClose = 0;
      const firstL = series.findIndex((_, i) => L(i));
      if (tv === 'all' && firstL >= 0 && C(0)) {
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
  }, [ALL, ID]);
  console.log(res.filter(r => r.tv === 'all').map(r => `${r.k}: open ${r.gapOpen} ms, close ${r.gapClose} ms, bare ${r.bareMs} ms`).join('\n'));
  for (const r of res) {
    expect.soft(r.both, `both copies of the changed datum at >= 0.15 [${r.k}]`).toEqual([]);
    expect.soft(r.over, `lens window over visible context text [${r.k}]`).toEqual([]);
    expect.soft(r.gapOpen, `open: ms with the datum shown nowhere [${r.k}]`).toBeLessThanOrEqual(200);
    expect.soft(r.gapClose, `close: ms with the datum shown nowhere [${r.k}]`).toBeLessThanOrEqual(200);
    expect.soft(r.bareMs, `ms of lens window with no legible text [${r.k}]`).toBeLessThanOrEqual(200);
  }
});

textSizeOverTime(ID, {presets: ALL, test, expect});
baselineTextAtHold(ID, {presets: ALL, test, expect});
coverageOverTime(ID, {groups: CONTENT, presets: ALL, test, expect});
playedVsSeek(ID, {presets: ALL, test, expect});
coldCreate(ID, {presets: ALL, test, expect});

// Rendered, 60 fps, every preset × ratio × labels shown/hidden: (1) the lens copy — the enlarged stage's texts and the
// datum card — is wholly inside the window's rim at every frame it is visible; (2) while the window is visible, at
// least 0.45 of the frame shows context (its width, or its height), any shorter dip lasting <= 200 ms.
test(`${ID}: RENDERED 60 fps — the lens copy stays inside the rim; the source highlight stays on its section; >= 0.45 of the frame shows context while the lens is open`, async ({page}) => {
  test.setTimeout(900000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const res = await page.evaluate(async ([id, ps]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of ps) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div'); el.className = 'slot'; document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; if (q.getAttribute('display') === 'none') return 0; const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
      const vb = svg.viewBox.baseVal, m = svg.getScreenCTM();
      const p0 = new DOMPoint(vb.x, vb.y).matrixTransform(m), p1 = new DOMPoint(vb.x + vb.width, vb.y + vb.height).matrixTransform(m);
      const FW = p1.x - p0.x, FH = p1.y - p0.y;
      const N = Math.round(x.durationMs / (1000 / 60));
      let outside = 0, firstOut = null, run = 0, worst = 0, minVis = 9, srcOff = 0, firstSrc = null;
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        x.seek(u * x.durationMs);
        const win = svg.querySelector('[data-node="lens-win"]');
        if (eff(win) < 0.05) { run = 0; continue; }
        const wb = svg.querySelector('[data-node="lens-bg"]').getBoundingClientRect();
        const inside = b => b.left >= wb.left - 1 && b.right <= wb.right + 1 && b.top >= wb.top - 1 && b.bottom <= wb.bottom + 1;
        const card = svg.querySelector('[data-node="lens-card"]');
        const copyTexts = [...svg.querySelectorAll('[data-node="lens-content"] text')].filter(t => eff(t) > 0.05 && t.textContent.trim());
        // (the copy is visible only inside its clip rectangle: that rectangle — same user space as the window — must lie
        // inside the rim)
        const at = (e, k) => parseFloat(e.getAttribute(k));
        const cr = svg.querySelector('[data-node="lens-cliprect"]'), bg = svg.querySelector('[data-node="lens-bg"]');
        const clipIn = at(cr, 'x') >= at(bg, 'x') - 0.5 && at(cr, 'y') >= at(bg, 'y') - 0.5 && at(cr, 'x') + at(cr, 'width') <= at(bg, 'x') + at(bg, 'width') + 0.5 && at(cr, 'y') + at(cr, 'height') <= at(bg, 'y') + at(bg, 'height') + 0.5;
        const bad = (card && eff(card) > 0.05 && !inside(card.getBoundingClientRect())) || (copyTexts.length > 0 && !clipIn);
        if (bad) { outside++; if (firstOut === null) firstOut = u; }
        // (3) the source highlight, when visible, frames its own section: its sides lie within a few px of the context
        // sheet's sides (the crop is the sheet's width plus a small margin) and it lies within the sheet's height
        const hl = svg.querySelector('[data-node="lens-src"]');
        if (hl && eff(hl) > 0.05) {
          const hb = hl.getBoundingClientRect(), sh = svg.querySelector('[data-node="st-sheet"]').getBoundingClientRect();
          const tol = Math.max(6, 0.06 * sh.width);
          const off = Math.abs(hb.left - sh.left) > tol || Math.abs(hb.right - sh.right) > tol || hb.top < sh.top - tol || hb.bottom > sh.bottom + tol;
          if (off) { srcOff++; if (firstSrc === null) firstSrc = u; }
        }
        const bs = ['st-pa', 'st-frame', 'st-cal'].map(n => svg.querySelector('[data-node="' + n + '"]').getBoundingClientRect());
        const L0 = Math.min(...bs.map(b => b.left)), R0 = Math.max(...bs.map(b => b.right)), T0 = Math.min(...bs.map(b => b.top)), B0 = Math.max(...bs.map(b => b.bottom));
        const ovX = Math.max(0, Math.min(R0, wb.right) - Math.max(L0, wb.left)), ovY = Math.max(0, Math.min(B0, wb.bottom) - Math.max(T0, wb.top));
        const visW = (R0 - L0) - (ovY > 0.35 * (B0 - T0) ? ovX : 0), visH = (B0 - T0) - (ovX > 0.35 * (R0 - L0) ? ovY : 0);
        const v = Math.max(visW / FW, visH / FH);
        minVis = Math.min(minVis, v);
        if (v < 0.45) { run++; worst = Math.max(worst, run); } else run = 0;
      }
      out.push({k: `${pr.name} ${tv} ${ratio}`, outside, firstOut, srcOff, firstSrc, dipMs: Math.round(worst * 1000 / 60), minVis: +minVis.toFixed(3)});
      x.destroy && x.destroy(); el.remove();
    }
    return out;
  }, [ID, ALL]);
  console.log(`${ID} lens copy outside rim (frames) / context dip below 0.45 (longest, ms) / min context share: ` + res.map(r => `${r.k} ${r.outside}/${r.dipMs}/${r.minVis}`).join(' · '));
  const bad = res.filter(r => r.outside > 0 || r.srcOff > 0 || r.dipMs > 200).map(r => `${r.k}: ${r.outside} frames outside${r.firstOut !== null ? ` from u ${r.firstOut.toFixed(3)}` : ''}, source highlight off its section ${r.srcOff} frames${r.firstSrc !== null ? ` from u ${r.firstSrc.toFixed(3)}` : ''}, dip ${r.dipMs} ms`);
  expect(bad, bad.join('\n')).toEqual([]);
});
