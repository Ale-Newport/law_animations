// LAW-0264 — Reconvención ilustrativa · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens holds a second copy of the rack and the
// calendar at the SAME coordinates, zoomed about them), the change is localized (only the day supplied for the
// additional claim: the calendar mark) and seeking back restores the previous datum exactly.
// Windows (u): context 0–0.20 · lens opens 0.20–0.32 (the context's datum tag gone by 0.247) · strike 0.44–0.49 · lens
// datum 0.50–0.56 · new value 0.56–0.585 (still to 0.66) · text out 0.66–0.68 · lens closes 0.675–0.72 · context change
// 0.74–0.80 · after tag 0.80–0.83 · Δ marker and note 0.82–0.88.
// Lens checklist, each as a rendered check below: VISIBLE context >= 0.45 of the frame width (portrait: either
// dimension, context + lens span >= 0.8); the lens's short side >= 0.35 of the frame's short side; nothing in the copy
// cut by the rim; one copy of the datum at a time, hand-over gaps <= 200 ms; the lens never over a head; magnification
// >= 1.6× on TEXT (the card's value against the context's datum tag) and >= 1.5× on the copy.
// LEGAL: the day is a supplied value; nothing follows from it (no time limit, no effect); both claims stay in the file.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, figuresAtLeast, fills, tagsBeside, TEXT_OFF_BARS, NEUTRAL_MARKERS, HEADS_OFF_TEXT, textFloorsOverTime, frameShareOverTime, seekIdentity, TEXT_LINES_VISIBLE} from './reconvencion-checks.js';
import {stressRules, bannedWords, coldCreate, glyphChecks} from './reconvencion-common.js';

const ID = 'LAW-0264';
const FIG = '[data-node="st-pa"], [data-node="st-pb"]';
const BASE = ['default', 'baseline-illustrative', 'baseline-es', 'contrast-or-alternative'];
const GL = glyphChecks('[data-node$="-glyph"]');
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];

contractSuite(ID, {
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextDatum === 'before' && s.markerShown === 0", label: 'context: the state produced by the action, old datum, nothing marked'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.zoom >= 1.5 && s.oldShown === 1 && s.datum === 'before' && s.lensClearOfFaces && s.contextScale === 1 && s.contextDim < 1", label: 'isolate: a real 1.5×+ lens beside the dimmed full-size context, old value shown'},
    {at: 0.47, fn: "s.strike > 0 && s.datum === 'before' && s.contextDatum === 'before'", label: 'the old value is struck before anything changes'},
    {at: 0.62, fn: "s.datum === 'after' && s.newShown === 1 && s.strike === 1 && s.contextDatum === 'before'", label: 'substitute inside the lens only: the copy carries the new state, the context is unchanged'},
    {at: 0.74, fn: 's.lensOpen === 0', label: 'the lens has closed before the context changes'},
    {at: 1, fn: "s.contextDatum === 'after' && s.dayCtx === s.days.after && s.days.after !== s.days.before && s.markerShown === 1 && s.tagAfter === 1 && s.truncated.length === 0 && s.labelsClear && s.bothClaimsKept", label: 'return: context updated (the mark on the after day), Δ marker and note, both claims kept, nothing cut'},
    {at: 0.62, fn: "s.dayLens === s.days.after && s.dayCtx === s.days.before && s.bothClaimsKept", label: 'inside the lens only the day changes; the context keeps the before day; both claims stay'},
    {at: 0.3, fn: "s.datum === 'before' && s.contextDatum === 'before' && s.dayCtx === s.days.before && s.dayLens === s.days.before && s.strike === 0 && s.newShown === 0", label: 'seeking back restores the old datum exactly'},
    {at: 0.62, params: {textVisibility: 'none'}, fn: "s.datum === 'after' && s.lensOpen === 1", label: 'labels hidden: the same isolation and substitution'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, p.documents.initialClaim.title, p.documents.initialClaim.summary, p.documents.additionalClaim.title, p.documents.additionalClaim.summary, ...p.dates.window, p.stages.initial, p.stages.additional, p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

const FRAME = `const vb = svg.viewBox.baseVal, m0 = svg.getScreenCTM(); const p0 = new DOMPoint(vb.x, vb.y).matrixTransform(m0), p1 = new DOMPoint(vb.x + vb.width, vb.y + vb.height).matrixTransform(m0); const FW = p1.x - p0.x, FH = p1.y - p0.y;`;
// rendered: the open lens's short side over the frame's short side; the VISIBLE context (the scene not covered by the
// lens) over the frame width (portrait: either dimension, with context + lens spanning >= 0.8 of the height)
const LENS_LARGE = `(() => {
  ${FRAME}
  const w = svg.querySelector('[data-node="lens-bg"]').getBoundingClientRect();
  const c = svg.querySelector('[data-node="ctx-stage"]').getBoundingClientRect();
  // (the part of the scene left of the lens when they share rows; the whole scene otherwise)
  const visW = w.top < c.bottom && w.bottom > c.top && w.left < c.right ? Math.max(0, Math.min(c.right, w.left) - c.left) : c.width;
  const tall = FH > FW * 1.2;
  const ctxOk = tall ? (c.width >= 0.45 * FW || c.height >= 0.45 * FH) && (Math.max(c.bottom, w.bottom) - Math.min(c.top, w.top)) >= 0.8 * (FH * 0.74) : visW >= 0.45 * FW;
  return Math.min(w.width, w.height) >= 0.35 * Math.min(FW, FH) && ctxOk;
})()`;
// rendered magnification against the context AT REST: (1) the enlarged copy's scale over the root's scale; (2) on TEXT:
// the card's value text over the context's datum tag text (both in the DOM whatever their opacity)
const ZOOM_VS_REST = `(() => {
  // (the copy's stage over the context's stage: both are the same scene drawn at its own scale)
  const z = svg.querySelector('[data-node="lz"]').getScreenCTM().a, c = svg.querySelector('[data-node="st"]').getScreenCTM().a;
  return z / c >= 1.5 - 1e-3;
})()`;
const MAG_ON_TEXT = `(() => {
  const px = t => parseFloat(getComputedStyle(t).fontSize) * t.getScreenCTM().a;
  const card = svg.querySelector('[data-node="val-old"] text'), tag = svg.querySelector('[data-node="tag-datum-g"] text');
  return Boolean(card && tag) && px(card) / px(tag) >= 1.6 - 1e-3;
})()`;
// the lens never lies over a head at any opacity (context heads; the copy's own heads are inside the window)
const LENS_OFF_HEADS = `(() => {
  const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  const bg = svg.querySelector('[data-node="lens-bg"]');
  if (eff(bg) <= 0) return true;
  const w = bg.getBoundingClientRect();
  if (w.width < 1) return true;
  const heads = [...svg.querySelectorAll('[data-node$="-pa-head"], [data-node$="-pb-head"]')].filter(e => !e.closest('[data-node="lens-content"]')).map(e => e.getBoundingClientRect());
  return heads.every(b => !(b.left < w.right && b.right > w.left && b.top < w.bottom && b.bottom > w.top));
})()`;
// before the substitution beat no stage state reads as the after value
const NO_EARLY_AFTER = `(() => {
  const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { if (e.getAttribute('display') === 'none') return 0; const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  return ['tag-datum2-g', 'val-new'].every(n => { const e = svg.querySelector('[data-node="' + n + '"]'); return !e || eff(e) < 0.05; });
})()`;
// labels hidden: no label text is drawn anywhere — not in the context, not in the lens (only the harness notice)
const NO_TEXT_HIDDEN = `(() => {
  const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { if (e.getAttribute('display') === 'none') return 0; const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  return [...svg.querySelectorAll('text')].filter(t => (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]')).every(t => eff(t) < 0.05);
})()`;
const BOTH_KEPT = `(() => ['st-ci-g', 'st-ca-g'].every(n => { const e = svg.querySelector('[data-node="' + n + '"]'); return e && e.getBoundingClientRect().width > 2 && e.getAttribute('opacity') !== '0'; }))()`;
const KEY_SHOWN = `(() => /As supplied · no conclusion drawn|Según lo aportado · sin conclusión/.test([...svg.querySelectorAll('text')].map(t => t.textContent).join(' ').replace(/\\u00a0/g, ' ')))()`;

ratioChecks(ID, 'lens checklist, faces, frame, people', [
  {at: times(0.2, 0.74, 0.02), fn: 's.lensClearOfFaces && s.contextScale === 1', label: 'the lens never covers a face; the context stays in place at full size (dimmed while the lens is open)'},
  {at: times(0.2, 0.74, 0.01), dom: LENS_OFF_HEADS, label: 'RENDERED: the lens never lies over a head, at any opacity (every 0.01)'},
  {at: [0, 0.4, 1], tv: ['none'], dom: fills(0.9, 0.55), label: 'labels hidden: the scene fills the caption-safe box (rest, lens open, hold)'},
  {at: [0.34, 0.45, 0.55, 0.64], fn: 's.contextDim < 1', label: 'the context is dimmed in place while the lens is open'},
  {at: [0.34, 0.45, 0.55, 0.64], dom: LENS_LARGE, label: 'RENDERED: the open lens >= 35 % of the frame short side; the VISIBLE context >= 45 % of the frame width (portrait: either dimension, context + lens >= 80 %)'},
  {at: [0.34, 0.45, 0.55, 0.64], dom: ZOOM_VS_REST, label: 'RENDERED: the copy is magnified >= 1.5× against the context at rest'},
  {at: [0.4], tv: ['all'], dom: MAG_ON_TEXT, label: 'RENDERED: magnification on TEXT — the card’s value >= 1.6× the context’s datum tag'},
  {at: [0.59, 0.62, 0.65], tv: ['all'], fn: 's.newShown === 1 && s.lensOpen === 1', label: 'the new value is still for >= 400 ms'},
  {at: [0, 0.3, 0.5, 0.65, 1], dom: FACES_CLEAR, label: 'no chip, tag, note or lens covers a head'},
  {at: [0, 0.4, 0.62, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  // standing people floors (production/SESSION_HANDOFF.md): baseline presets >= 60 px at 16:9 and 9:16 and >= 55 px at
  // 1:1, at rest and at the hold; stress >= 45 px; context people >= 45 px while the lens is open
  {at: [0.1, 1], presets: BASE, ratios: ['16:9', '9:16'], dom: figuresAtLeast(60, FIG), label: 'baseline presets at 16:9 and 9:16: figures >= 60 px tall at rest and hold'},
  {at: [0.1, 1], presets: BASE, ratios: ['1:1'], dom: figuresAtLeast(55, FIG), label: 'baseline presets at 1:1: figures >= 55 px tall at rest and hold'},
  {at: [0.1, 1], presets: ['long-labels-stress'], dom: figuresAtLeast(45, FIG), label: 'long-labels-stress: figures >= 45 px tall at rest and hold'},
  {at: [0.3, 0.4, 0.5, 0.62, 0.7], dom: figuresAtLeast(45, FIG), label: 'context figures >= 45 px tall while the lens is open'},
  {at: times(0, 1, 0.05), dom: BOTH_KEPT, label: 'LEGAL: both claims stay drawn in the context at every sampled u (neither is erased)'},
  {at: [0, 1], dom: GL.neutral, label: 'LEGAL: claim glyphs are only ● / ◆ — no ticks, no green'},
  {at: [0, 1], dom: GL.equal, label: 'LEGAL: ● and ◆ have equal weight'},
  {at: [1], tv: ['all'], dom: tagsBeside(['tag-']), label: 'the datum tag sits beside the calendar mark (leader <= 40 px), its leader crosses no text'},
  {at: [0.6, 1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers (the Δ marker is neutral)'},
  {at: [0, 0.3, 0.4, 0.5, 0.62, 0.7, 1], tv: ['none'], dom: NO_TEXT_HIDDEN, label: 'RENDERED: labels hidden — no label text in the context or in the lens at any sampled u'},
  {at: [0, 1], tv: ['all'], dom: KEY_SHOWN, label: 'the "as supplied · no conclusion drawn" key is shown'},
]);
ratioChecks(ID, 'text off filler bars', [
  {at: times(0, 1, 0.05), dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
]);
ratioChecks(ID, 'dense: in frame and heads off text', [
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02: text, props, lens)'},
  {at: times(0, 1, 0.04), dom: HEADS_OFF_TEXT, label: 'RENDERED: no head is drawn over visible text'},
]);
ratioChecks(ID, 'dense: no early after value', [
  {at: times(0, 0.49, 0.01), dom: NO_EARLY_AFTER, label: 'RENDERED: before the substitution beat the after state is never shown'},
  {at: times(0, 0.49, 0.01), fn: "s.contextDatum === 'before' && s.datum === 'before'", label: 'before the substitution beat: the old datum in the context and in the lens'},
]);

// Rendered, every 20 ms over the lens phase: (1) a bare lens card never lasts more than 200 ms; (2) every text in the
// copy is wholly inside the window or wholly outside it; (3) the guides cross no face and no text.
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
        const cp = q('lens-cliprect'), cm = cp.getScreenCTM();
        const c0 = new DOMPoint(+cp.getAttribute('x'), +cp.getAttribute('y')).matrixTransform(cm);
        const c1 = new DOMPoint(+cp.getAttribute('x') + +cp.getAttribute('width'), +cp.getAttribute('y') + +cp.getAttribute('height')).matrixTransform(cm);
        const cr = {left: c0.x, top: c0.y, right: c1.x, bottom: c1.y};
        // (every drawn piece of the copy — sheets, threads, pins, glyphs, the board — lies wholly inside the window or
        // wholly outside it: the rim cuts nothing; the window's own backing rect is excluded)
        for (const e of q('lens-zoom').querySelectorAll('path, rect, circle, line, ellipse, polygon')) {
          if (eff(e) < 0.05) continue;
          const b = e.getBoundingClientRect();
          if (b.width < 0.5 && b.height < 0.5) continue;
          const over = b.left < cr.right - 1 && b.right > cr.left + 1 && b.top < cr.bottom - 1 && b.bottom > cr.top + 1;
          const inside = b.left >= cr.left - 1 && b.right <= cr.right + 1 && b.top >= cr.top - 1 && b.bottom <= cr.bottom + 1;
          if (over && !inside) cut.push(`${u.toFixed(2)}:${e.tagName}:${(e.closest('[data-node]') || {}).getAttribute?.('data-node')}`);
        }
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
        const sr = q('lens-src').getBoundingClientRect();
        const within = b => b.left >= sr.left - 2 && b.right <= sr.right + 2 && b.top >= sr.top - 2 && b.bottom <= sr.bottom + 2;
        const texts = [...svg.querySelectorAll('text')].filter(t => eff(t) > 0.3 && t.textContent.trim() && !t.closest('[data-node="lens-win"]') && !t.closest('[data-layer="content-notice"]')).map(t => t.getBoundingClientRect()).filter(b => !within(b));
        for (const n of ['lens-coneA', 'lens-coneB']) {
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
  }, [presets, ID]);
  for (const r of res) {
    expect.soft(r.worst, `bare lens card run (ms) [${r.k}]`).toBeLessThanOrEqual(200);
    expect.soft(r.cut, `lens copy (text or any drawn piece) cut by the rim [${r.k}]`).toEqual([]);
    expect.soft(r.cross, `lens guides crossing a face or text [${r.k}]`).toEqual([]);
  }
});

// Rendered at 60 fps over the whole animation in every preset × ratio × labels state: (1) the changed datum is shown in
// ONE place at a time — its context copy (the datum tag) and the lens's copy (the card's value texts) are never both at
// >= 0.15 opacity; (2) the open lens window intersects no visible context text; (3) hand-over gaps <= 200 ms.
test(`${ID}: one copy of the changed datum at a time, hand-over gaps <= 200 ms; the lens lies over no visible context text (rendered, 60 fps)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const res = await page.evaluate(async ([ps, id]) => {
    const def = await window.__lib.load(id);
    const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { if (e.getAttribute('display') === 'none') return 0; const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
    const out = [];
    for (const [w, hh] of [[1920, 1080], [1080, 1080], [1080, 1920]]) for (const pr of ps) for (const tv of ['all']) {
      const el = document.createElement('div'); el.className = 'slot'; document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: hh, instanceId: 'dc', params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = el.querySelector('svg');
      const q = n => svg.querySelector(`[data-node="${n}"]`);
      const both = [], over = [];
      const frames = Math.round(x.durationMs / (1000 / 60));
      const series = [];
      let bare = 0, bareMax = 0;
      for (let f = 0; f <= frames; f++) {
        const u = f / frames;
        x.seek(u * x.durationMs);
        const ctxCopy = Math.max(0, ...[...svg.querySelectorAll('[data-node="tag-datum-g"] text, [data-node="tag-datum2-g"] text')].map(eff));
        const lensTexts = [...svg.querySelectorAll('[data-node="lens-content"] text, [data-node="val-old"] text, [data-node="val-new"] text')].filter(t => (t.textContent || '').trim());
        const lensCopy = Math.max(0, ...lensTexts.map(eff));
        const bgW = q('lens-bg');
        const winOn = bgW && eff(bgW) >= 0.05 && bgW.getBoundingClientRect().width > 2;
        bare = winOn && lensCopy < 0.15 ? bare + 1 : 0;
        bareMax = Math.max(bareMax, bare);
        series.push([ctxCopy, lensCopy]);
        if (ctxCopy >= 0.15 && lensCopy >= 0.15) both.push(u.toFixed(3));
        if (eff(bgW) >= 0.05) {
          const W = bgW.getBoundingClientRect();
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
      out.push({k: `${pr.name} ${w}x${hh} ${tv}`, both: both.slice(0, 4), over: [...new Set(over)].slice(0, 4), gapOpen, gapClose, bareMs: Math.round(bareMax * fm)});
      x.destroy(); el.remove();
    }
    return out;
  }, [presets, ID]);
  for (const r of res) {
    expect.soft(r.both, `both copies of the changed datum at >= 0.15 [${r.k}]`).toEqual([]);
    expect.soft(r.over, `lens window over visible context text [${r.k}]`).toEqual([]);
    expect.soft(r.gapOpen, `open: ms with the datum shown nowhere [${r.k}]`).toBeLessThanOrEqual(200);
    expect.soft(r.gapClose, `close: ms with the datum shown nowhere [${r.k}]`).toBeLessThanOrEqual(200);
    expect.soft(r.bareMs, `ms of lens window with no legible text (bare card) [${r.k}]`).toBeLessThanOrEqual(200);
  }
});

textFloorsOverTime(ID, {presets: ALL, test, expect});
frameShareOverTime(ID, {presets: ALL, test, expect});
seekIdentity(ID, {presets: ALL, test, expect});

ratioChecks(ID, 'es locale: Spanish defaults', [
  {at: [0.45, 1], tv: ['all'], presets: ['default'], params: {locale: 'es'}, dom: "(() => { const t = [...svg.querySelectorAll('text')].filter(e => !e.closest('[data-layer=\"content-notice\"]')).map(e => e.textContent).join(' ').replace(/\\u00a0/g, ' '); return !/\\b(Party|Day \\d|fictional|Case file|Claim|Initial|Additional|claim|supplied|Calendar|Before|After|Datum|changed|kept|dated|As supplied)\\b/.test(t) && /Parte A/.test(t); })()", label: 'with only locale "es", every default text is shown in Spanish (no English default remains)'},
]);

ratioChecks(ID, 'every label line visible', [
  {at: [0.1, 1], tv: ['all'], dom: TEXT_LINES_VISIBLE, label: 'RENDERED: no line of a visible text is hidden behind a prop or a person (at rest and at the hold; while the lens is open the context is dimmed and the lens lies over no visible text — see the 60 fps test)'},
]);

test(`${ID}: DOM-less sweep — preset × ratio × labels`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const dur = def.defaultParams.durationMs;
  for (const pr of ALL) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'key', 'none']) {
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const s = def.evaluate({width: w, height: h, params: {...pr.params, textVisibility: tv}, timeMs: Math.min(dur, u * dur)}).semantic;
      const tag = `${pr.name} ${w}x${h} ${tv} u=${u.toFixed(2)}`;
      expect(s.zoom >= 1.5 && s.lensClearOfFaces && s.bothClaimsKept, tag).toBe(true);
      expect(s.truncated, tag).toEqual([]);
      if (u < 0.49) expect(s.datum === 'before' && s.contextDatum === 'before', tag).toBe(true);
      if (u >= 0.8) expect(s.contextDatum, tag).toBe('after');
    }
  }
});

stressRules(ID, {test, expect});
bannedWords(ID, {test, expect});
coldCreate(ID, {test, expect});
