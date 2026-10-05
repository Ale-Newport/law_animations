// LAW-0280 — Ordenación de cuestiones · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens holds a second copy of the sorting board's
// grid — its column headers, both subject strips and every card in its cell — at the SAME coordinates, zoomed about
// them, its texts printed), the change is localized (only the third card's state: its old glyph goes, it slides along
// the Subject B row into the other column, its new glyph comes; Issue 1 and Issue 2 stay where they are) and seeking
// back restores the previous datum exactly.
// Windows (u): lens opens 0.20–0.32; old value struck 0.44–0.49; inside the lens 0.50–0.56 the old glyph goes, the card
// moves, the new glyph comes; the hidden context copy takes the new state from 0.56; card text and copy fade 0.66–0.68;
// the window goes 0.67–0.685 and the context (the third card with its glyph, the after tag) comes back in the new state
// 0.681–0.69; lens closes 0.675–0.72; Δ marker and note 0.82–0.88.
// LEGAL: both states are supplied values of equal weight ("agreed" only means the supplied list marks the issue as agreed
// between the parties); nothing is decided or proven; no procedure, effect or outcome.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, fills, tagsBeside, TEXT_OFF_BARS, NEUTRAL_MARKERS, HEADS_OFF_TEXT, textFloorsOverTime, frameShareOverTime, seekIdentity, TEXT_LINES_VISIBLE, NO_LONE_LINES} from './ordenacion-checks.js';
import {stressRules, bannedWords, coldCreate, glyphChecks, esDefaults, glyphGlue} from './ordenacion-common.js';

const ID = 'LAW-0280';
const BASE = ['default', 'baseline-illustrative', 'baseline-es', 'contrast-or-alternative'];
const P = name => presetsFor(ID).find(q => q.name === name).params;
const GL = glyphChecks('[data-node$="-glyph"]');
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];

contractSuite(ID, {
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextDatum === 'before' && s.markerShown === 0", label: 'context: the state produced by the grouping, old datum, nothing marked'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.zoom >= 1.5 && s.oldShown === 1 && s.datum === 'before' && s.lensClearOfFaces && s.contextScale === 1 && s.contextDim < 1", label: 'isolate: a real 1.5×+ lens beside the dimmed full-size context, old value shown'},
    {at: 0.47, fn: "s.strike > 0 && s.datum === 'before' && s.contextDatum === 'before'", label: 'the old value is struck before anything changes'},
    {at: 0.62, fn: "s.datum === 'after' && s.newShown === 1 && s.strike === 1 && s.ctxGlyph === 0 && s.tagAfter === 0", label: 'substitute inside the lens: the copy carries the new state; the context copy stays hidden under the open lens'},
    {at: 0.74, fn: 's.lensOpen === 0', label: 'the lens has closed before the context changes'},
    {at: 1, fn: "s.contextDatum === 'after' && s.stateCtx === s.states.after && s.states.after !== s.states.before && s.ctxColumn === s.states.after && s.ctxShown === 1 && s.markerShown === 1 && s.tagAfter === 1 && s.truncated.length === 0 && s.labelsClear", label: 'return: the context in the new state (the card in the other column, its new glyph), the after tag and the Δ marker'},
    {at: 0.62, fn: "s.stateLens === s.states.after && s.lensColumn === s.states.after && !s.lensGlyphBoth && s.ctxShown === 0", label: 'inside the lens only the third card’s state changes (the card in the other column; the context copy hidden)'},
    {at: 0.7, fn: "s.lensOpen < 0.5 && s.stateCtx === s.states.after && s.contextDatum === 'after' && s.ctxShown === 1 && s.tagAfter === 1", label: 'as the lens closes the context is back already in the new state (the old state never returns)'},
    {at: 0.3, fn: "s.datum === 'before' && s.contextDatum === 'before' && s.stateCtx === s.states.before && s.stateLens === s.states.before && s.strike === 0 && s.newShown === 0 && s.lensColumn === s.states.before", label: 'seeking back restores the old datum exactly (context and lens)'},
    {at: 0.4, fn: "s.ctxGlyph === 0 && s.ctxShown === 0", label: 'one copy at a time: while the lens holds the datum the context’s third card (and its glyph) is hidden'},
    {at: 0.1, fn: "s.states.before === 'agreed' && s.ctxColumn === 'agreed' && s.ctxShown === 1", label: 'default: the agreed state before, the third card in the ● column'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.states.before === 'open' && s.stateCtx === 'agreed' && s.ctxColumn === 'agreed'", label: 'alternative preset: the opposite substitution (open → agreed) with other supplied data'},
    {at: 0.62, params: {textVisibility: 'none'}, fn: "s.datum === 'after' && s.lensOpen === 1 && s.lensColumn === s.states.after", label: 'labels hidden: the same isolation and substitution'},
    {at: 0.4, fn: 's.lensTextPx >= 19.5', label: 'the lens prints the board’s texts >= 19.5 px (default)'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, ...p.documents.issues, p.documents.subjects.a, p.documents.subjects.b, ...p.dates.window, p.stages.agreed, p.stages.open, p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker];",
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
  const heads = [...svg.querySelectorAll('[data-node$="-pa-head"], [data-node$="-pb-head"], [data-node$="-pc-head"]')].filter(e => !e.closest('[data-node="lens-content"]')).map(e => e.getBoundingClientRect());
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
// the Δ marker keeps clear of every head and of both figures as drawn (rendered bounding boxes, a 2 px margin)
const MARKER_OFF_FIGURES = `(() => {
  const m = svg.querySelector('[data-node="marker"]');
  if (!m) return true;
  const a = m.getBoundingClientRect();
  const figs = [...svg.querySelectorAll('[data-node$="-pa-head"], [data-node$="-pb-head"], [data-node$="-pc-head"], [data-node="st-pa"], [data-node="st-pb"], [data-node="st-pc"]')].filter(e => !e.closest('[data-node="lens-content"]')).map(e => e.getBoundingClientRect());
  return figs.every(b => !(a.left < b.right + 2 && a.right > b.left - 2 && a.top < b.bottom + 2 && a.bottom > b.top - 2));
})()`;
// Issue 1 and Issue 2 stay drawn in the context at every sampled u, side by side and apart; all three cards have the
// same width
const CARDS_KEPT = `(() => { const fs = ['st-f0-g', 'st-f1-g'].map(n => svg.querySelector('[data-node="' + n + '"]')); if (fs.some(f => !f)) return false;
  const rs = fs.map(e => e.getBoundingClientRect()); const c = svg.querySelector('[data-node="st-f2-g"]').getBoundingClientRect();
  return fs.every(e => e.getBoundingClientRect().width > 2 && e.getAttribute('opacity') !== '0') && Math.min(rs[0].right, rs[1].right) - Math.max(rs[0].left, rs[1].left) <= 0.5 && Math.abs(c.width - rs[0].width) < 1; })()`;
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
  {at: [0.1, 1], presets: BASE, ratios: ['16:9', '9:16'], dom: headsAtLeast(60), label: 'baseline presets at 16:9 and 9:16: heads >= 60 px at rest and hold'},
  {at: [0.1, 1], presets: BASE, ratios: ['1:1'], dom: headsAtLeast(55), label: 'baseline presets at 1:1: heads >= 55 px at rest and hold'},
  {at: [0.1, 1], presets: ['long-labels-stress'], dom: headsAtLeast(45), label: 'long-labels-stress: heads >= 45 px at rest and hold'},
  {at: [0.3, 0.4, 0.5, 0.62, 0.7], dom: headsAtLeast(45), label: 'context heads >= 45 px while the lens is open'},
  {at: times(0, 1, 0.05), dom: CARDS_KEPT, label: 'LEGAL: Party A’s and Party B’s cards stay drawn and apart in the context at every sampled u; the newcomer’s card has the same size'},
  {at: [0, 1], dom: GL.neutral, label: 'LEGAL: version glyphs are only ● / ◆ — no ticks, no green'},
  {at: [0, 1], dom: GL.equal, label: 'LEGAL: ● and ◆ have equal weight'},
  {at: [1], tv: ['all'], dom: tagsBeside(['tag-']), label: 'the datum tag sits beside the case file’s plate (leader <= 40 px), its leader crosses no text'},
  {at: [0.6, 1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers (the Δ marker is neutral)'},
  {at: [0.82, 0.86, 0.9, 1], dom: MARKER_OFF_FIGURES, label: 'RENDERED: the Δ marker lies clear of every head and of both figures (2 px margin) at the hold'},
  {at: [1], tv: ['all'], fn: 's.markerClear === true', label: 'the Δ marker was placed clear of every placed label, head box and figure'},
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
// copy is wholly inside the window or wholly outside it; (3) the guides cross no face and no text; (4) the dashed source
// frame (lens-src) crosses no head (bbox widened by 4 px at 1080p), no figure (st-pa / st-pb bbox) and no visible text
// or chip (text bbox widened by 4 px); (5) no guide line crosses a framed piece, prop or figure — every preset × ratio
// × labels all / key / none.
test(`${ID}: lens — bare card ≤ 200 ms, no text cut by the rim, guides clear (rendered, every 20 ms)`, async ({page}) => {
  test.setTimeout(400000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = presetsFor(ID);
  const res = await page.evaluate(async ([ps, id]) => {
    const def = await window.__lib.load(id);
    const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
    const out = [];
    for (const [w, hh] of [[1920, 1080], [1080, 1080], [1080, 1920]]) for (const pr of ps) for (const tv of ['all', 'key', 'none']) {
      const el = document.createElement('div'); el.className = 'slot'; document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: hh, instanceId: 'lc', params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = el.querySelector('svg');
      const q = n => svg.querySelector(`[data-node="${n}"]`);
      let run = 0, worst = 0; const cut = [], cross = [], frame = [], guideHits = [];
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
        const heads = [...svg.querySelectorAll('[data-node$="-pa-head"], [data-node$="-pb-head"], [data-node$="-pc-head"]')].filter(e => !e.closest('[data-node="lens-content"]')).map(e => e.getBoundingClientRect());
        const sr = q('lens-src').getBoundingClientRect();
        const within = b => b.left >= sr.left - 2 && b.right <= sr.right + 2 && b.top >= sr.top - 2 && b.bottom <= sr.bottom + 2;
        const texts = [...svg.querySelectorAll('text')].filter(t => eff(t) > 0.3 && t.textContent.trim() && !t.closest('[data-node="lens-win"]') && !t.closest('[data-layer="content-notice"]')).map(t => t.getBoundingClientRect()).filter(b => !within(b));
        // (4) the source frame's four edges
        const src = q('lens-src');
        if (src && eff(src) >= 0.05) {
          const m = src.getScreenCTM(), bb = src.getBBox();
          const P = (X, Y) => new DOMPoint(X, Y).matrixTransform(m);
          const cs = [P(bb.x, bb.y), P(bb.x + bb.width, bb.y), P(bb.x + bb.width, bb.y + bb.height), P(bb.x, bb.y + bb.height)];
          // (px at 1080p: the harness viewBox is in output pixels)
          const K = svg.getScreenCTM().a;
          const grow = (b, d) => ({left: b.left - d * K, right: b.right + d * K, top: b.top - d * K, bottom: b.bottom + d * K});
          const obst = [
            ...[...svg.querySelectorAll('[data-node$="-pa-head"], [data-node$="-pb-head"], [data-node$="-pc-head"]')].filter(e => !e.closest('[data-node="lens-win"]')).map(e => ['head', grow(e.getBoundingClientRect(), 4)]),
            ...[...svg.querySelectorAll('[data-node="st-pa"], [data-node="st-pb"], [data-node="st-pc"]')].map(e => ['figure', e.getBoundingClientRect()]),
            ...[...svg.querySelectorAll('text')].filter(t => eff(t) > 0.05 && t.textContent.trim() && !t.closest('[data-node="lens-win"]') && !t.closest('[data-layer="content-notice"]')).map(t => [t.textContent.slice(0, 14), grow(t.getBoundingClientRect(), 4)]),
          ];
          for (let e = 0; e < 4; e++) {
            const A = cs[e], B = cs[(e + 1) % 4];
            const hitO = obst.find(([, b]) => Array.from({length: 81}, (_, i) => ({x: A.x + (B.x - A.x) * i / 80, y: A.y + (B.y - A.y) * i / 80})).some(p => p.x > b.left && p.x < b.right && p.y > b.top && p.y < b.bottom));
            if (hitO) { frame.push(`${u.toFixed(2)}:${hitO[0]}`); break; }
          }
        }
        // (5) no guide line (any line drawn with the frame) crosses a framed piece, a prop or a figure
        const props = [...svg.querySelectorAll('[data-node="st-board"], [data-node="st-cal"], [data-node="st-bar"], [data-node^="st-f"][data-node$="-g"], [data-node="st-pa"], [data-node="st-pb"], [data-node="st-pc"]')].map(e => [e.dataset.node, e.getBoundingClientRect()]);
        for (const l of q('lens-guides').querySelectorAll('line, path, polyline')) {
          if (eff(l) < 0.05) continue;
          const len = l.getTotalLength ? l.getTotalLength() : 0, m = l.getScreenCTM();
          for (let i = 1; i < 40; i++) {
            const p = l.getPointAtLength(len * i / 40).matrixTransform(m);
            const hitP = props.find(([, b]) => p.x > b.left && p.x < b.right && p.y > b.top && p.y < b.bottom);
            if (hitP) { guideHits.push(`${u.toFixed(2)}:${l.dataset.node || l.tagName}×${hitP[0]}`); break; }
          }
        }
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
      out.push({k: `${pr.name} ${w}x${hh} ${tv}`, worst, cut: [...new Set(cut)].slice(0, 3), cross: [...new Set(cross)].slice(0, 3), frame: [...new Set(frame)].slice(0, 3), guideHits: [...new Set(guideHits)].slice(0, 3)});
      x.destroy(); el.remove();
    }
    return out;
  }, [presets, ID]);
  for (const r of res) {
    expect.soft(r.worst, `bare lens card run (ms) [${r.k}]`).toBeLessThanOrEqual(200);
    expect.soft(r.cut, `lens copy (text or any drawn piece) cut by the rim [${r.k}]`).toEqual([]);
    expect.soft(r.cross, `lens guides crossing a face or text [${r.k}]`).toEqual([]);
    expect.soft(r.frame, `lens source frame crossing a head, figure, text or chip [${r.k}]`).toEqual([]);
    expect.soft(r.guideHits, `a lens guide crossing a framed piece, prop or figure [${r.k}]`).toEqual([]);
  }
});

// Rendered at 60 fps over the whole animation in every preset × ratio × labels state: (1) the changed datum is shown in
// ONE place at a time — its context copy (the datum tag) and the lens's copy (the card's value texts) are never both at
// >= 0.15 opacity; (2) the open lens window intersects no visible context text; (3) hand-over gaps <= 200 ms — the
// datum's, and the column's return after the window goes.
test(`${ID}: one copy of the changed datum (text and marks) at a time, hand-over gaps <= 180 ms; the lens lies over no visible context text (rendered, 60 fps)`, async ({page}) => {
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
      const both = [], over = [], bothMarks = [], oldAfter = [];
      let lensSeen = false, lensGone = false;
      const frames = Math.round(x.durationMs / (1000 / 60));
      const series = [];
      let bare = 0, bareMax = 0;
      // (the column texts under the window: hidden while the lens is open, back as the window goes)
      const colTexts = [...svg.querySelectorAll('[data-node^="colg-"] text')].filter(t => (t.textContent || '').trim());
      const colSeries = [], winSeries = [], tagSeries = [];
      // (review r1: the substitution in the lens is sequenced — the new value starts only once the old one is under 0.15;
      // no chip stays visible while its target is hidden or covered, and the column leaves as one while the window shows)
      const valSeq = [], stranded = [];
      const txOf = n => [...svg.querySelectorAll(`[data-node="${n}"] text`)].filter(t => (t.textContent || '').trim());
      const valOld = txOf('val-old'), valNew = txOf('val-new');
      const chipTargets = [['chip-a', 'st-pa'], ['chip-b', 'st-pb'], ...[...svg.querySelectorAll('[data-node^="colg-"]')].map(e => [e.dataset.node, ({'colg-trays': 'st-plT', 'colg-cal': 'st-cal'})[e.dataset.node] || 'st-board'])].filter(([c, t2]) => q(c) && q(t2));
      for (let f = 0; f <= frames; f++) {
        const u = f / frames;
        x.seek(u * x.durationMs);
        const ctxCopy = Math.max(0, ...[...svg.querySelectorAll('[data-node="tag-datum-g"] text, [data-node="tag-datum2-g"] text')].map(eff));
        // (the non-text datum: the context's third card with its glyph vs the lens copy's)
        const ctxMarks = Math.max(0, ...['st-f2-g'].map(n => (q(n) ? eff(q(n)) : 0)));
        const lensMarks = Math.max(0, ...['lz-f2-g'].map(n => (q(n) ? eff(q(n)) : 0)));
        if (ctxMarks >= 0.15 && lensMarks >= 0.15) bothMarks.push(u.toFixed(3));
        // (after the lens has closed, no mark of the OLD state — its frame group, its plate glyph, the old tag — shows)
        const bgV = q('lens-bg') ? eff(q('lens-bg')) : 0;
        if (bgV >= 0.05) lensSeen = true; else if (lensSeen) lensGone = true;
        if (lensGone) {
          const sem = x.getState({bounds: false}).semantic;
          const oldA = sem.states.before === 'agreed';
          const oldMarks = Math.max(...(oldA ? ['st-f2-ga'] : ['st-f2-go']).map(n => (q(n) ? eff(q(n)) : 0)), ...[...svg.querySelectorAll('[data-node="tag-datum-g"] text')].map(eff), 0);
          // (and the third card is where the new state puts it, visible)
          const card = q('st-f2-g');
          // (the card's own opacity: the whole context is still dimmed while the window closes)
          if (oldMarks >= 0.15 || sem.ctxColumn !== sem.states.after || eff(card) / Math.max(1e-6, eff(q('ctx'))) < 0.15) oldAfter.push(u.toFixed(3));
        }
        const lensTexts = [...svg.querySelectorAll('[data-node="lens-content"] text, [data-node="val-old"] text, [data-node="val-new"] text')].filter(t => (t.textContent || '').trim());
        const lensCopy = Math.max(0, ...lensTexts.map(eff));
        const bgW = q('lens-bg');
        const winOn = bgW && eff(bgW) >= 0.05 && bgW.getBoundingClientRect().width > 2;
        bare = winOn && lensCopy < 0.15 ? bare + 1 : 0;
        bareMax = Math.max(bareMax, bare);
        series.push([ctxCopy, lensCopy]);
        colSeries.push(colTexts.map(eff)); winSeries.push(Boolean(winOn));
        tagSeries.push(Math.max(0, ...[...svg.querySelectorAll('[data-node="tag-datum-g"] text, [data-node="tag-datum2-g"] text')].map(eff)));
        if (ctxCopy >= 0.15 && lensCopy >= 0.15) both.push(u.toFixed(3));
        const vo = Math.max(0, ...valOld.map(eff)), vn = Math.max(0, ...valNew.map(eff));
        if (vn > 0.001 && vo >= 0.15) valSeq.push(u.toFixed(3));
        {
          const W = winOn ? bgW.getBoundingClientRect() : null;
          for (const [c, t2] of chipTargets) {
            const cv = Math.max(0, ...[...q(c).querySelectorAll('text')].filter(t => (t.textContent || '').trim()).map(eff));
            if (cv < 0.15) continue;
            const tg = q(t2), tb = tg.getBoundingClientRect();
            const ix = W ? Math.max(0, Math.min(tb.right, W.right) - Math.max(tb.left, W.left)) * Math.max(0, Math.min(tb.bottom, W.bottom) - Math.max(tb.top, W.top)) : 0;
            const covered = W && ix > 0.5 * tb.width * tb.height;
            if (eff(tg) < 0.05 || covered || (W && c.startsWith('colg-'))) { stranded.push(`${u.toFixed(3)}:${c}`); break; }
          }
        }
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
      // column return: from the last frame of the window to the first frame with the hidden column texts back (>= 0.15)
      let colGap = 0;
      const lastWin = winSeries.lastIndexOf(true);
      if (lastWin > 0) {
        const mid = Math.round(series.length * 0.5);
        const hid = colTexts.map((_, j) => j).filter(j => colSeries[mid][j] < 0.05 && colSeries[0][j] >= 0.15);
        if (hid.length) { let k2 = lastWin + 1; while (k2 < series.length && Math.max(...hid.map(j => colSeries[k2][j])) < 0.15) k2++; colGap = Math.round((k2 - lastWin - 1) * fm); }
      }
      // return: from the old datum tag to the new one (after the lens has closed) — the longest run with neither shown
      let tagGap = 0, tr = 0;
      for (let i = Math.ceil(series.length * 0.7); i < series.length; i++) { tr = tagSeries[i] >= 0.15 ? 0 : tr + 1; tagGap = Math.max(tagGap, tr); }
      out.push({k: `${pr.name} ${w}x${hh} ${tv}`, both: both.slice(0, 4), bothMarks: bothMarks.slice(0, 4), oldAfter: oldAfter.slice(0, 4), over: [...new Set(over)].slice(0, 4), gapOpen, gapClose, bareMs: Math.round(bareMax * fm), colGap, tagGap: Math.round(tagGap * fm), valSeq: valSeq.slice(0, 4), stranded: [...new Set(stranded)].slice(0, 4)});
      x.destroy(); el.remove();
    }
    return out;
  }, [presets, ID]);
  for (const r of res) {
    expect.soft(r.both, `both copies of the changed datum at >= 0.15 [${r.k}]`).toEqual([]);
    expect.soft(r.bothMarks, `both copies of the datum (the third card with its glyph, context and lens) at >= 0.15 [${r.k}]`).toEqual([]);
    expect.soft(r.oldAfter, `after the lens closes, a mark of the old state at >= 0.15, or the third card not shown in its new column [${r.k}]`).toEqual([]);
    // (labels hidden: no text at all — only the marks are checked)
    if (r.k.endsWith('none')) continue;
    expect.soft(r.over, `lens window over visible context text [${r.k}]`).toEqual([]);
    expect.soft(r.valSeq, `the new value starts while the old one is still >= 0.15 (cross-fade) [${r.k}]`).toEqual([]);
    expect.soft(r.stranded, `a chip visible while its target is hidden or covered, or a column chip left while the window shows [${r.k}]`).toEqual([]);
    expect.soft(r.gapOpen, `open: ms with the datum shown nowhere [${r.k}]`).toBeLessThanOrEqual(180);
    expect.soft(r.gapClose, `close: ms with the datum shown nowhere [${r.k}]`).toBeLessThanOrEqual(180);
    expect.soft(r.bareMs, `ms of lens window with no legible text (bare card) [${r.k}]`).toBeLessThanOrEqual(200);
    expect.soft(r.tagGap, `return: ms with neither the old nor the new datum tag shown [${r.k}]`).toBeLessThanOrEqual(180);
    expect.soft(r.colGap, `close: ms of blank panel before the column texts under the window come back [${r.k}]`).toBeLessThanOrEqual(180);
  }
});

textFloorsOverTime(ID, {presets: ALL, test, expect});
frameShareOverTime(ID, {presets: ALL, test, expect});
seekIdentity(ID, {presets: ALL, test, expect});

esDefaults(ID, [0.45, 1], '|Datum|changed|represented');

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
      expect(s.zoom >= 1.5 && s.lensClearOfFaces && !s.lensGlyphBoth, tag).toBe(true);
      expect(s.truncated, tag).toEqual([]);
      if (u < 0.49) expect(s.datum === 'before' && s.contextDatum === 'before', tag).toBe(true);
      if (u >= 0.8) expect(s.contextDatum, tag).toBe('after');
      if (tv === 'all') expect(s.markerClear, `${tag} Δ marker clear of heads and figures`).toBe(true);
      expect(s.frameClear, `${tag} source frame clear of heads, labels and keys`).toBe(true);
    }
  }
});


ratioChecks(ID, 'no one-word lines', [
  {at: times(0, 1, 0.05), tv: ['all'], dom: NO_LONE_LINES, label: 'RENDERED: no wrapped title, chip, tag, plate, card or label has a one-word line (every 0.05; es-only too)'},
  {at: [0.3, 0.6, 1], tv: ['all'], presets: ['default'], params: {locale: 'es'}, dom: NO_LONE_LINES, label: 'RENDERED: es-only — no one-word line'},
]);
stressRules(ID, {test, expect});
bannedWords(ID, {test, expect});
coldCreate(ID, {test, expect});
glyphGlue(ID);

// Lens magnification at SIZED hosts (SESSION_HANDOFF "LENS MAGNIFICATION MARGIN": >= 1.5× at every host size): a
// 640×360 element and 800×600 / 1400×1000 outputs, every preset, labels shown; the copy over the context at rest and on
// text (the card's value over the context's datum tag); the lens's smaller side >= 0.35 of the frame's short side.
test(`${ID}: lens magnification >= 1.5× at sized hosts (640×360 element, 800×600, 1400×1000)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const res = await page.evaluate(async ([ps, id]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const [w, hh, cssW] of [[640, 360, 640], [800, 600, 800], [1400, 1000, 1400], [1080, 1920, 360], [1080, 1080, 500]]) for (const pr of ps) {
      const el = document.createElement('div'); el.style.width = cssW + 'px'; document.body.appendChild(el);
      const x = def.create(el, {width: w, height: hh, params: pr.params}); await x.ready; x.seek(x.durationMs * 0.4);
      const svg = el.querySelector('svg');
      const q = n => svg.querySelector(`[data-node="${n}"]`);
      const z = q('lz').getScreenCTM().a / q('st').getScreenCTM().a;
      const px = t => parseFloat(getComputedStyle(t).fontSize) * t.getScreenCTM().a;
      const card = svg.querySelector('[data-node="val-old"] text'), tag = svg.querySelector('[data-node="tag-datum-g"] text');
      const vb = svg.viewBox.baseVal, m0 = svg.getScreenCTM();
      const p0 = new DOMPoint(vb.x, vb.y).matrixTransform(m0), p1 = new DOMPoint(vb.x + vb.width, vb.y + vb.height).matrixTransform(m0);
      const lw = q('lens-bg').getBoundingClientRect();
      out.push({k: `${pr.name} ${w}x${hh}`, z: Math.round(z * 1000) / 1000, text: card && tag ? Math.round(px(card) / px(tag) * 1000) / 1000 : null, side: Math.round(Math.min(lw.width, lw.height) / Math.min(p1.x - p0.x, p1.y - p0.y) * 1000) / 1000});
      x.destroy(); el.remove();
    }
    return out;
  }, [presets, ID]);
  for (const r of res) {
    expect.soft(r.z, `copy over context at rest [${r.k}]`).toBeGreaterThanOrEqual(1.5);
    if (r.text !== null) expect.soft(r.text, `on text [${r.k}]`).toBeGreaterThanOrEqual(1.5);
    expect.soft(r.side, `lens smaller side / frame short side [${r.k}]`).toBeGreaterThanOrEqual(0.35);
  }
  console.log(JSON.stringify(res.map(r => [r.k, r.z, r.text, r.side])));
});

// Lens fill (coordinator decision 2026-10-05, LENS FILL METRIC), rendered at every preset × ratio through the whole open
// phase (lens opacity >= 0.95 at its full size, every 0.005 of u), labels shown: the drawn lens content (the copy's board
// panel and the datum card's band) covers >= 0.40 of the window, and the legible texts in the lens (opacity >= 0.3)
// >= 0.30 of it.
test(`${ID}: rendered lens fill — content >= 0.40 and text >= 0.30 of the window through the open phase (labels shown)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const res = await page.evaluate(async ([ps, id]) => {
    const def = await window.__lib.load(id);
    const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
    const out = [];
    for (const [w, hh, ratio] of [[1920, 1080, '16:9'], [1080, 1080, '1:1'], [1080, 1920, '9:16']]) for (const pr of ps) {
      const el = document.createElement('div'); el.className = 'slot'; document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: hh, instanceId: 'lf', params: {...pr.params, textVisibility: 'all'}});
      await x.ready;
      const svg = el.querySelector('svg');
      const q = n => svg.querySelector('[data-node="' + n + '"]');
      const R = e => { const b = e.getBoundingClientRect(); return {l: b.left, t: b.top, r: b.right, b: b.bottom}; };
      const clipA = (B, L) => Math.max(0, Math.min(B.r, L.r) - Math.max(B.l, L.l)) * Math.max(0, Math.min(B.b, L.b) - Math.max(B.t, L.t));
      let mxW = 0;
      for (let u = 0.2; u <= 0.76; u += 0.005) { x.seek(u * x.durationMs); if (eff(q('lens-win')) >= 0.95) mxW = Math.max(mxW, R(q('lens-bg')).r - R(q('lens-bg')).l); }
      let n = 0, minF = 9, minT = 9;
      for (let u = 0.2; u <= 0.76; u += 0.005) {
        x.seek(u * x.durationMs);
        if (eff(q('lens-win')) < 0.95) continue;
        const L = R(q('lens-bg'));
        if (L.r - L.l < 0.99 * mxW) continue;
        n++;
        const A = (L.r - L.l) * (L.b - L.t);
        let ta = 0;
        for (const t of q('lens-win').querySelectorAll('text')) if (eff(t) >= 0.3 && t.textContent.trim()) ta += clipA(R(t), L);
        // (the drawn content: the copy's board panel — its first path — inside the window, and the datum card's band)
        const panel = q('lz') && q('lz').querySelector('path');
        const clip = R(q('lens-cliprect'));
        let ca = panel && eff(panel) >= 0.3 ? clipA(R(panel), {l: Math.max(L.l, clip.l), t: Math.max(L.t, clip.t), r: Math.min(L.r, clip.r), b: Math.min(L.b, clip.b)}) : 0;
        ca += Math.max(0, L.b - clip.b) * (L.r - L.l);
        minF = Math.min(minF, ca / A); minT = Math.min(minT, ta / A);
      }
      out.push({k: pr.name + ' ' + ratio, n, minF: Math.round(minF * 1000) / 1000, minT: Math.round(minT * 1000) / 1000});
      x.destroy(); el.remove();
    }
    return out;
  }, [[{name: 'default', params: {}}, ...presetsFor(ID)], ID]);
  console.log(JSON.stringify(res));
  for (const r of res) {
    expect.soft(r.n, `open frames sampled [${r.k}]`).toBeGreaterThanOrEqual(40);
    expect.soft(r.minF, `lens content fill [${r.k}]`).toBeGreaterThanOrEqual(0.4);
    expect.soft(r.minT, `lens text coverage [${r.k}]`).toBeGreaterThanOrEqual(0.3);
  }
});

// Labels hidden: the lens still shows the change without any text — the copy's third card moves into the other column
// (>= 20 px at 1080p) and its glyph changes shape (● ↔ ◆), never both glyphs at once.
ratioChecks(ID, 'labels hidden: a visible non-text change inside the lens', [
  {at: [0.45, 0.62], tv: ['none'], dom: `(() => { const q = n => svg.querySelector('[data-node="' + n + '"]'); const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
    const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (Math.min(vb.width, vb.height) / 1080);
    const now = {x: q('lz-f2-g').getBoundingClientRect().left, a: eff(q('lz-f2-ga')), o: eff(q('lz-f2-go'))};
    if (eff(q('lens-content')) < 0.95 || Math.max(now.a, now.o) < 0.9 || Math.min(now.a, now.o) > 0.05) return false;
    if (u < 0.5) { svg.__lzBefore = now; return true; }
    const b = svg.__lzBefore; return Boolean(b) && Math.abs(now.x - b.x) / K >= 20 && Math.abs(now.a - b.a) > 0.9 && Math.abs(now.o - b.o) > 0.9; })()`, label: 'RENDERED: labels hidden — inside the lens the third card shows exactly one glyph; by u 0.62 it has moved >= 20 px into the other column and its glyph changed shape'},
]);
