// LAW-0200 — Reunión de equipo jurídico · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens content is a real copy of the
// inspected card AND of the owner's arm, hand and magnet, drawn at their context coordinates and posed from the
// context every frame), the change is local (only that card's assignee and its dependent geometry: the owner takes
// the magnet back; the other cards stay), and seeking back restores the old datum exactly.
// Windows (LAW-0200.js W): lens opens 0.22–0.34 · strike 0.37–0.42 (lens annotation) · owner reaches up 0.44–0.49 and
// carries the magnet back to the chest 0.49–0.60 (wording change: the card turns over 0.46–0.56) · new value still
// until the lens closes 0.74–0.80 · Δ marker 0.80–0.84 · "Changed"/"was:" chips 0.80–0.86 · key 0.80–0.85.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0200';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['handFocus', 'magFocus'],
  attach: [
    // the owner carries the magnet from the solved hand once it is taken out of the slot, and keeps it at the chest
    {from: 0.492, to: 1, a: 'handFocus', b: 'gripFocus', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.magnetAt === 'card' && !s.markerVisible", label: 'context: every card linked; old datum; no marker'},
    {at: 0.36, fn: "s.lensOpen === 1 && s.datum === 'before' && s.zoom >= 1.5 && JSON.stringify(s.lensCopyAt) === JSON.stringify(s.contextCardAt)", label: 'isolate: a real enlarged copy (≥ 1.5×) at the card’s own coordinates'},
    {at: 0.43, fn: "s.strike === 1 && s.datum === 'before' && s.magnetAt === 'card'", label: 'the old value is struck (annotation) before anything changes'},
    {at: 0.47, fn: "s.datum === 'changing' && s.magnetAt === 'card' && s.lensOpen === 1", label: 'cause first: the owner reaches up to the magnet, seen in the scene and in the lens'},
    {at: 0.62, fn: "s.datum === 'after' && s.magnetAt === 'hand' && s.lensOpen === 1", label: 'effect after cause: the magnet is back in the owner’s hand; the card shows the new value'},
    {at: 0.81, fn: "s.lensOpen === 0 && s.datum === 'after'", label: 'the lens has closed onto the identical card'},
    {at: 1, fn: "s.markerVisible && s.oldShown === 1 && s.magnetAt === 'hand' && JSON.stringify(s.filled) === '[1,1,0]' && s.allReached && s.labelsFit", label: 'return: Δ marker, struck old value kept, empty slot; the other cards stay linked'},
    {at: 0.3, fn: "s.datum === 'before' && s.strike === 0 && s.magnetAt === 'card'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.focusTarget === 'task' && s.datum === 'after' && JSON.stringify(s.filled) === '[1,1,1]' && s.markerVisible", label: 'wording substitution: the task wording changes, every magnet stays'},
    {at: 0.52, params: {textVisibility: 'none'}, fn: "s.lensOpen === 1 && s.datum === 'changing'", label: 'labels hidden: the same isolation and change'},
  ],
});

ratioChecks(ID, 'lens clear of heads, guides clear, neighbours wholly in or out, zoom, marker, still value', [
  {at: times(0.22, 0.8, 0.01), fn: 's.lensClearOfHeads && s.guidesClear && s.neighboursWhole && (s.lensOpen < 1 || s.zoom >= 1.5) && !s.overHeads && s.allReached', label: 'lens off every head, guides clear, neighbour cards wholly in/out, ≥ 1.5×, hands reach'},
  {at: [1], fn: 's.markerClearOfHeads && s.markerClearOfHands && s.markerVisible && s.labelsFit', label: 'Δ marker clear of heads and hands; layout fits'},
  {at: times(0.61, 0.74, 0.01), fn: "s.datum === 'after' && s.lensOpen === 1", label: 'the new value stays still in the open lens for ≥ 400 ms'},
  {at: times(0, 1, 0.02), fn: 's.armGap >= 0 && s.magArmGap >= 0', label: 'no arm crosses a neighbour’s arm; no magnet over a neighbour’s arm'},
]);

// Rendered: the lens copy is the context — the copied magnet, thumb, arm and card state carry exactly the context's
// attributes at every sampled time (so the lens can never show a state the scene does not show).
const MIRROR = `(() => {
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  const fi = ['a', 'b', 'c'].indexOf(P_FOCUS);
  const pairs = [['st-m' + fi, 'lzm'], ['st-th' + fi, 'lzth'], ['st-p' + fi + '-arms', 'lzp-arms']];
  for (const sd of ['l', 'r']) pairs.push(['st-p' + fi + '-' + sd + '-hand', 'lzp-' + sd + '-hand'], ['st-p' + fi + '-' + sd + '-l', 'lzp-' + sd + '-l']);
  for (const k of ['owner', 'open', 'dash', 'solid']) pairs.push(['st-card' + fi + '-' + k, 'lzc-' + k]);
  for (const [a, b] of pairs) {
    const A = q(a), B = q(b);
    if (!A && !B) continue;
    if (!A || !B) return false;
    for (const at of ['transform', 'x1', 'y1', 'x2', 'y2']) if ((A.getAttribute(at) || '') !== (B.getAttribute(at) || '')) return false;
    if (a.startsWith('st-card') && (A.getAttribute('opacity') || '1') !== (B.getAttribute('opacity') || '1') && !(parseFloat(A.getAttribute('opacity')) >= 0 && a.endsWith('-text'))) {
      // the focus card's row text in the scene may only be LOWER than in the copy, and only while the lens is still
      // opening (u < 0.34): it fades where the moving rim crosses it; once the lens is open both are identical
      const ctxOp = parseFloat(A.getAttribute('opacity') || '1'), copyOp = parseFloat(B.getAttribute('opacity') || '1');
      if (!(u < 0.34 && (k => k === 'owner' || k === 'open')(a.split('-').pop()) && ctxOp < copyOp)) return false;
    }
  }
  return true;
})()`;
ratioChecks(ID, 'the lens copy mirrors the scene (rendered)', [
  {at: times(0.3, 0.74, 0.02), tv: ['all'], dom: MIRROR.replace('P_FOCUS', '"c"'), presets: ['baseline-illustrative', 'long-labels-stress', 'baseline-es'], label: 'rendered: lens copy attributes equal the context’s (card state, arm, hand, magnet)'},
]);

// Rendered: no hand or arm segment of any person covers visible text (sampled along each drawn arm line with its
// stroke half-width, and over each hand's box), every preset × ratio at dense times.
const HANDS_CLEAR_OF_TEXT = `(() => {
  const vis = e => { for (let q = e; q && q !== svg; q = q.parentElement) { const o = q.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.05) return false; if (q.getAttribute('display') === 'none') return false; } return true; };
  const texts = [...svg.querySelectorAll('text tspan, text')].filter(t => (t.tagName === 'tspan' || !t.querySelector('tspan')) && (t.textContent || '').trim() && vis(t) && !t.closest('[data-layer="content-notice"]') && !t.closest('[data-node="lz"]'))
    .map(t => ({el: t, r: t.getBoundingClientRect()})).filter(q => q.r.width > 1).map(q => ({el: q.el, l: q.r.left + 1, t: q.r.top + 1, r: q.r.right - 1, b: q.r.bottom - 1}));
  // only a limb painted AFTER the text (on top of it) covers it
  let limb = null;
  const inT = (x, y, pad) => texts.some(b => x > b.l - pad && x < b.r + pad && y > b.t - pad && y < b.b + pad && (b.el.compareDocumentPosition(limb) & Node.DOCUMENT_POSITION_FOLLOWING));
  for (const ln of svg.querySelectorAll('line[data-node]')) {
    const nm = ln.getAttribute('data-node');
    if (!/^st-p\\d-[lr]-(u|l)$/.test(nm) || !vis(ln)) continue;
    limb = ln;
    const m = ln.getScreenCTM();
    const A = new DOMPoint(+ln.getAttribute('x1'), +ln.getAttribute('y1')).matrixTransform(m), B = new DOMPoint(+ln.getAttribute('x2'), +ln.getAttribute('y2')).matrixTransform(m);
    const half = parseFloat(ln.getAttribute('stroke-width')) * Math.abs(m.a) / 2;
    for (let i = 0; i <= 20; i++) { const x = A.x + (B.x - A.x) * i / 20, y = A.y + (B.y - A.y) * i / 20; if (inT(x, y, half)) return false; }
  }
  for (const hd of svg.querySelectorAll('[data-node$="-hand"]')) {
    if (!/^st-p\\d-[lr]-hand$/.test(hd.getAttribute('data-node')) || !vis(hd)) continue;
    limb = hd;
    const r = hd.getBoundingClientRect();
    const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
    if (inT(cx, cy, Math.min(r.width, r.height) * 0.35)) return false;
  }
  return true;
})()`;
ratioChecks(ID, 'hands and arms never cover text (rendered)', [
  {at: times(0, 1, 0.02), tv: ['all'], dom: HANDS_CLEAR_OF_TEXT, label: 'rendered: no arm or hand over any visible text'},
]);

// 16:9: the scene (board + table) stays full width at rest and at the hold — the lens lies over the scene
// only while it is open. Measured on the render against the caption-safe box (default margins 6% each side).
const SCENE_WIDTH = `(() => {
  const vb = svg.viewBox.baseVal, R = svg.getBoundingClientRect(), k = vb.width / R.width;
  const bs = ['st-board', 'st-table-top'].map(n => svg.querySelector('[data-node="' + n + '"]')).filter(Boolean).map(e => e.getBoundingClientRect());
  if (bs.length < 2) return false;
  const x0 = Math.min(...bs.map(b => b.left)), x1 = Math.max(...bs.map(b => b.right));
  return (x1 - x0) * k >= 0.8 * vb.width * (1 - 0.06 - 0.06);
})()`;
ratioChecks(ID, 'wide frames: scene fills the safe width at rest and hold (rendered)', [
  {at: [0.1, 1], ratios: ['16:9'], dom: SCENE_WIDTH, label: 'rendered: board + table span >= 80% of the caption-safe width'},
]);

suppliedTextSuite(ID, {
  fields: "return [...p.actors.map(a => a.name).filter((n, i) => !(p.focusTarget === 'assignee' && ['a','b','c'][i] === p.props.focusCard)), p.roles.a, p.roles.b, p.roles.c, ...p.props.tasks.filter(t => p.focusTarget !== 'task' || t !== p.beforeValue), p.props.document, p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker]",
  content: 'return [p.beforeValue, p.afterValue, p.contextLabels.marker]',
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

test.describe('LAW-0200 lens rim (rendered)', () => {
  test('LAW-0200: no lens-copy text box crosses the lens rim (u 0.22–0.80, every preset × ratio × labels)', async ({page}) => {
    test.setTimeout(240000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0200')];
    const bad = await page.evaluate(async ([presets]) => {
      const def = await window.__lib.load('LAW-0200');
      const out = [];
      for (const pr of presets) {
        for (const tv of ['all', 'none']) {
          for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
            const el = document.createElement('div');
            document.getElementById('slots').appendChild(el);
            const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
            await x.ready;
            const svg = x.element;
            const node = n => svg.querySelector(`[data-node="${n}"]`);
            const shown = e => { for (let q = e; q && q !== svg; q = q.parentNode) { const o = q.getAttribute && q.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.05) return false; } return true; };
            let texts = 0;
            for (let u = 0.22; u <= 0.8 + 1e-9; u += 0.01) {
              x.seek(u * x.durationMs);
              const win = node('lz-win'), border = node('lz-border');
              if (!win || !shown(win)) continue;
              const inv = svg.getScreenCTM().inverse();
              const toRoot = (px, py) => { const q = new DOMPoint(px, py).matrixTransform(inv); return {x: q.x, y: q.y}; };
              const bm = border.getScreenCTM();
              const c0 = new DOMPoint(+border.getAttribute('x'), +border.getAttribute('y')).matrixTransform(bm);
              const c1 = new DOMPoint(+border.getAttribute('x') + +border.getAttribute('width'), +border.getAttribute('y') + +border.getAttribute('height')).matrixTransform(bm);
              const W0 = toRoot(c0.x, c0.y), W1 = toRoot(c1.x, c1.y);
              for (const t of node('lz-content').querySelectorAll('text')) {
                if (!shown(t)) continue;
                // a supplied field (one text block) is wholly in the lens copy or wholly left out
                const spans = [...t.querySelectorAll('tspan')];
                const rootBox = e => { const b = e.getBoundingClientRect(); const p0 = toRoot(b.left, b.top), p1 = toRoot(b.right, b.bottom); return {p0, p1, w: b.width, h: b.height}; };
                const full = spans.filter(ts => (ts.textContent || '').trim());
                const vis = full.filter(ts => { const {p0, p1, w: bw, h: bh} = rootBox(ts); return bw >= 0.5 && bh >= 0.5 && p0.x < W1.x && p1.x > W0.x && p0.y < W1.y && p1.y > W0.y; });
                if (vis.length && (vis.length !== full.length || full.length !== spans.length)) out.push(`${pr.name} ${ratio} labels:${tv} u=${u.toFixed(2)}: field "${(t.textContent || '').trim().slice(0, 30)}" is only partly in the lens (${vis.length} of ${spans.length} lines)`);
                if (!(t.textContent || '').trim()) continue;
                for (const ts of t.querySelectorAll('tspan').length ? t.querySelectorAll('tspan') : [t]) {
                  if (!(ts.textContent || '').trim()) continue;
                  const b = ts.getBoundingClientRect();
                  if (b.width < 0.5 || b.height < 0.5) continue;
                  const p0 = toRoot(b.left, b.top), p1 = toRoot(b.right, b.bottom);
                  texts++;
                  const over = p0.x < W1.x && p1.x > W0.x && p0.y < W1.y && p1.y > W0.y;
                  const inside = p0.x >= W0.x - 1 && p1.x <= W1.x + 1 && p0.y >= W0.y - 1 && p1.y <= W1.y + 1;
                  if (over && !inside) out.push(`${pr.name} ${ratio} labels:${tv} u=${u.toFixed(2)}: lens copy line "${ts.textContent.slice(0, 30)}" is cut by the rim`);
                }
              }
            }
            if (tv === 'all' && !texts) out.push(`${pr.name} ${ratio}: no lens text found (test would be vacuous)`);
            x.destroy?.();
            el.remove();
          }
        }
      }
      return [...new Set(out)].slice(0, 40);
    }, [presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});
