// LAW-0208 — Jerarquía judicial editable · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens holds a second copy of the podium feet
// and the tag drawn at the SAME coordinates, cropped to the tag), the change is localised (only the inspected tag's
// value and its dependent geometry — that podium's level and its links — change; every other podium stays), and
// seeking back to earlier times restores exactly the previous datum.
// Windows (LAW-0208.js W): build rise 0.03–0.15, links 0.15–0.19 · frame 0.20–0.24 · scene shrinks 0.215–0.28 · lens
// opens 0.28–0.36 · strike 0.46–0.50 · old value docks 0.51–0.55 · new value 0.555–0.585 · podium moves 0.59–0.67 ·
// lens closes 0.72–0.77 · scene grows back 0.77–0.83 · marker 0.855–0.89; everything still from 0.89.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0208';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['focusRoof'],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.markerShown === 0 && s.contextScale === 1", label: 'context: the ordered podiums, the old datum, no lens, no marker'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.datum === 'before' && s.zoom >= 1.5 && s.stackInCrop && s.lensClearOfPeople && s.lensClearOfSource && s.lensClearOfScene", label: 'isolate: a real enlargement (>= 1.5x) of the whole tag, clear of every person, the scene and its source'},
    {at: 0.4, fn: 'JSON.stringify(s.lensCopyAt) !== "{}" && s.tagAt.x >= s.lensCopyAt.x && s.tagAt.y >= s.lensCopyAt.y', label: 'the lens copy is cropped at the tag’s own context coordinates'},
    {at: 0.49, fn: "s.datum === 'changing' && s.strike > 0 && s.focusLevel === s.beforeLevel", label: 'substitute: the old value is struck before anything moves'},
    {at: 0.585, fn: "s.oldDocked === 1 && s.newShown === 1 && s.focusLevel === s.beforeLevel", label: 'the old value is docked as “was”, the new value shown; the podium has not moved yet (cause first)'},
    {at: 0.63, fn: 's.focusLevel > s.beforeLevel && s.focusLevel < s.afterLevel && s.lensOpen === 1', label: 'the dependent geometry follows: the inspected podium moves while the lens is open'},
    {at: 0.7, fn: "s.datum === 'after' && s.focusLevel === s.afterLevel && s.lensOpen === 1", label: 'the new value and the new level'},
    {at: 0.8, fn: "s.lensOpen === 0 && s.datum === 'after'", label: 'return: the lens has closed onto the updated context'},
    {at: 1, fn: "s.markerShown === 1 && s.datum === 'after' && s.oldDocked === 1 && s.contextScale === 1 && s.allReached && s.problems.length === 0", label: 'hold: full-size context, struck old value docked, marker shown'},
    {at: 1, fn: 'JSON.stringify(s.others) === JSON.stringify([null, 2, 3])', label: 'the change is local: every other podium stays on its supplied level'},
    {at: 0.3, fn: "s.datum === 'before' && s.strike === 0 && s.oldDocked === 0 && s.focusLevel === s.beforeLevel", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.focusTarget === 'level' && s.moves && s.beforeLevel === 2 && s.afterLevel === 1 && s.focusLevel === 1 && s.markerShown === 1", label: 'alternative: a different supplied level — the review body’s podium moves down to the origin level'},
    {at: 1, params: {focusTarget: 'wording', beforeValue: 'Tag: origin level (draft)', afterValue: 'Tag: origin level'}, fn: "!s.moves && s.datum === 'after' && s.focusLevel === s.beforeLevel", label: 'wording substitution (still supported): only the tag wording changes; nothing moves'},
    {at: 0.62, fn: 's.lensOpen === 1 && s.focusLevel > s.beforeLevel && s.stackInCrop', label: 'the podium moves to the supplied level INSIDE the lens (crop holds both positions)'},
    {at: 0.5, fn: 's.lensLong >= 0.45', label: 'the lens is large (its long side >= 45 % of the frame short side)'},
    {at: 0.66, params: {textVisibility: 'none'}, fn: 's.lensOpen === 1 && s.focusLevel > s.beforeLevel', label: 'labels hidden: the same localised change is visible'},
    {at: 1, params: {afterLevel: 1}, fn: '!s.moves && s.focusLevel === 1', label: 'an after-level equal to the current level moves nothing (nothing inferred)'},
  ],
});

suppliedTextSuite(ID, {
  fields: 'return [...p.courts.levels.map(l => l.name), ...p.courts.bodies.map(b => b.label), p.labels.note, p.labels.key, p.afterValue, p.beforeValue, p.contextLabels.context, p.contextLabels.marker]',
  content: 'return [...p.courts.bodies.map(b => b.label), p.afterValue, p.beforeValue]',
  captions: 'return [p.contextLabels.context, p.contextLabels.marker, p.labels.note]',
});

const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const PEOPLE = "const people = [...svg.querySelectorAll('[data-node]')].filter(e => /^h-room\\d+-p\\d+$/.test(e.getAttribute('data-node')));";
const peopleMin = min => `(() => { ${K} ${PEOPLE}
  return people.length > 0 && people.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); return hd.width / K >= ${min * 26 / 60} && e.getBoundingClientRect().width / K >= ${min}; });
})()`;
// no chip, marker, panel item or lens window covers a head
const NO_COVER = `(() => { ${BOX} ${PEOPLE}
  const heads = people.map(e => bx(svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]')));
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^(h-lab\\d+-body|h-plate\\d+|cx-tag|cx-marker|pn\\d-\\w+|lz-border)$/.test(e.getAttribute('data-node')) && visible(e)).map(bx);
  return heads.length > 0 && cards.every(c => heads.every(hd => !hit(c, hd, 1)));
})()`;
// the substituted value (and, once docked, the struck old value) stay visible at >= 16 px through the return and hold
const VALUE_TRACE = `(() => { ${K}
  const s0 = svg.getScreenCTM().a;
  const vis = e => { for (let q = e; q && q !== svg; q = q.parentNode) { const o = q.getAttribute && q.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.5) return false; } return true; };
  const ok = n => { const g = svg.querySelector('[data-node="' + n + '"]'); if (!g || !vis(g)) return false; const t = g.querySelector('text'); const px = parseFloat(getComputedStyle(t).fontSize) * (t.getScreenCTM().a / s0) * 1080 / Math.min(vb.width, vb.height); return px >= 16 - 0.05; };
  const lensOpen = (() => { const l = svg.querySelector('[data-node="lz"]'); return l && parseFloat(l.getAttribute('opacity') || '0') > 0.5; })();
  return lensOpen ? (ok('lz-new') && ok('lz-was')) : (ok('cx-new') && ok('cx-was'));
})()`;
// the guides start on the source frame, end on the lens and cross no text or head
const GUIDES = `(() => { ${BOX} ${PEOPLE}
  const heads = people.map(e => bx(svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]')));
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]') && !t.closest('[data-node="lz"]')).map(bx);
  const lines = [...svg.querySelectorAll('[data-node^="guide"]')].filter(e => visible(e));
  if (!lines.length) return false;
  for (const ln of lines) {
    const m = ln.getScreenCTM();
    const A = new DOMPoint(+ln.getAttribute('x1'), +ln.getAttribute('y1')).matrixTransform(m), B = new DOMPoint(+ln.getAttribute('x2'), +ln.getAttribute('y2')).matrixTransform(m);
    for (let j = 2; j <= 38; j++) { const q = {x: A.x + (B.x - A.x) * j / 40, y: A.y + (B.y - A.y) * j / 40}; if ([...texts, ...heads].some(o => q.x > o.l - 2 && q.x < o.r + 2 && q.y > o.t - 2 && q.y < o.b + 2)) return false; }
  }
  return true;
})()`;
// the lens copy mirrors the scene: the inspected podium, its riding group and the tag states carry the same attributes
const MIRROR = `(() => {
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  const fi = [0, 1, 2].find(i => q('lz-u' + i) && q('lz-u' + i).getAttribute('opacity') === '1');
  if (fi === undefined) return false;
  const pairs = [['h-pod' + fi, 'lz-pod' + fi, ['y', 'height']], ['h-u' + fi, 'lz-u' + fi, ['transform']], ['cx-ride', 'lz-ride', ['transform']],
    ['cx-old', 'lz-old', ['opacity', 'transform']], ['cx-new', 'lz-new', ['opacity']], ['cx-was', 'lz-was', ['opacity']], ['cx-st0', 'lz-st0', ['x1', 'x2']]];
  for (const [a, b, ats] of pairs) {
    const A = q(a), B = q(b);
    if (!A && !B) continue;
    if (!A || !B) return false;
    for (const at of ats) if ((A.getAttribute(at) || '') !== (B.getAttribute(at) || '')) return false;
  }
  return true;
})()`;
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";

// Lens-phase framing (updated lens checklist): the drawn context (podium columns and level bands) keeps >= 45 % of the
// caption-safe width at every u, and while the lens is open context + lens span >= 80 % of the safe width.
const SAFE_W = "const vb = svg.viewBox.baseVal; const m = svg.getScreenCTM().inverse(); const X = v => new DOMPoint(v, 0).matrixTransform(m).x; const sw = vb.width * 0.88;";
const CTX_SPAN = "const ctxEls = [...svg.querySelectorAll('[data-node]')].filter(e => /^h-pod\\d+$/.test(e.getAttribute('data-node')) || e.getAttribute('data-node') === 'h-bands'); const rs = ctxEls.map(e => e.getBoundingClientRect()); const cl = X(Math.min(...rs.map(q => q.left))), cr = X(Math.max(...rs.map(q => q.right)));";
const CONTEXT_WIDE = `(() => { ${SAFE_W} ${CTX_SPAN} return (cr - cl) >= 0.45 * sw; })()`;
const CONTEXT_LENS_FILL = `(() => { ${SAFE_W} ${CTX_SPAN} const b = svg.querySelector('[data-node="lz-border"]').getBoundingClientRect(); return (Math.max(cr, X(b.right)) - Math.min(cl, X(b.left))) >= 0.8 * sw; })()`;

ratioChecks(ID, 'lens checklist, people size, value traceable, guides, mirror, fill', [
  {at: times(0, 1, 0.02), dom: CONTEXT_WIDE, label: 'rendered: the drawn context keeps >= 45 % of the safe width at every u'},
  {at: times(0.34, 0.7, 0.04), dom: CONTEXT_LENS_FILL, label: 'rendered: while the lens is open, context + lens span >= 80 % of the safe width'},
  {at: [0.1, 1], fn: 's.contextScale === 1 && s.textOnScene === 1 && s.lensOpen === 0', label: 'build and hold: the scene fills its area at full size, every text on it shown, no lens'},
  {at: [0.4, 0.5, 0.6, 0.7], fn: 's.zoom >= 1.5 && s.lensOpen === 1 && s.stackInCrop', label: 'the lens enlarges >= 1.5x and holds the whole tag and its docked value'},
  {at: times(0.2, 0.8, 0.02), fn: 's.lensClearOfPeople && s.lensClearOfSource && s.lensClearOfScene', label: 'the lens never covers a person, the scene or its own source'},
  {at: times(0.66, 0.71, 0.01), tv: ['all'], fn: "s.newShown === 1 && s.lensOpen === 1 && s.focusLevel === s.afterLevel", label: 'the new value is readable and still in the lens for >= 400 ms (move done 0.66, close from 0.715)'},
  {at: times(0.2, 0.9, 0.02), dom: peopleMin(45), label: 'rendered: while the lens phase runs every person stays >= 45 px across (1080p)'},
  {at: [0, 0.1, 0.19, 0.9, 1], dom: peopleMin(60), label: 'rendered: at rest, build and hold people >= 60 px across, heads >= 26 px (1080p)'},
  {at: times(0.77, 1, 0.01), tv: ['all'], dom: VALUE_TRACE, label: 'rendered: through the return and hold the new value and the struck old value stay visible at >= 16 px'},
  {at: times(0, 1, 0.03), dom: NO_COVER, label: 'rendered: no chip, marker, panel or lens window covers a head'},
  {at: [0.3, 0.5, 0.7], dom: GUIDES, label: 'rendered: guides cross no text or head'},
  {at: times(0.3, 0.74, 0.02), tv: ['all'], dom: MIRROR, label: 'rendered: the lens copy carries exactly the scene’s podium and tag attributes'},
  {at: [1], fn: 's.markerShown === 1 && s.markerClearOfHeads', label: 'the Δ marker is clear of the room plans and heads'},
  {at: [1], dom: FILL, label: 'rendered: scene and panel fill the caption-safe box'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);

test.describe(`${ID} lens rim (rendered)`, () => {
  test(`${ID}: no lens-copy text box crosses the lens rim; each field wholly in or out (every preset × ratio × labels)`, async ({page}) => {
    test.setTimeout(240000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
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
              const win = node('lz'), border = node('lz-border');
              if (!win || !shown(win)) continue;
              const inv = svg.getScreenCTM().inverse();
              const toRoot = (px, py) => { const q = new DOMPoint(px, py).matrixTransform(inv); return {x: q.x, y: q.y}; };
              const bm = border.getScreenCTM();
              const c0 = new DOMPoint(+border.getAttribute('x'), +border.getAttribute('y')).matrixTransform(bm);
              const c1 = new DOMPoint(+border.getAttribute('x') + +border.getAttribute('width'), +border.getAttribute('y') + +border.getAttribute('height')).matrixTransform(bm);
              const W0 = toRoot(c0.x, c0.y), W1 = toRoot(c1.x, c1.y);
              for (const t of node('lz-content').querySelectorAll('text')) {
                if (!shown(t)) continue;
                const spans = [...t.querySelectorAll('tspan')];
                const rootBox = e => { const b = e.getBoundingClientRect(); const p0 = toRoot(b.left, b.top), p1 = toRoot(b.right, b.bottom); return {p0, p1, w: b.width, h: b.height}; };
                const full = spans.filter(ts => (ts.textContent || '').trim());
                const vis = full.filter(ts => { const {p0, p1, w: bw, h: bh} = rootBox(ts); return bw >= 0.5 && bh >= 0.5 && p0.x < W1.x && p1.x > W0.x && p0.y < W1.y && p1.y > W0.y; });
                if (vis.length && (vis.length !== full.length || full.length !== spans.length)) out.push(`${pr.name} ${ratio} labels:${tv} u=${u.toFixed(2)}: field "${(t.textContent || '').trim().slice(0, 30)}" is only partly in the lens`);
                for (const ts of spans) {
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
            x.destroy();
            el.remove();
          }
        }
      }
      return [...new Set(out)].slice(0, 40);
    }, [ID, presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

// Coordinator decision 2026-09-26: visible text is never below 16 px at 1080p, at every sampled time.
test.describe(`${ID} text size over time`, () => {
  test(`${ID}: every visible text ≥ 16 px at every sampled u`, async ({page}) => {
    test.setTimeout(300000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
        for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: pr.params});
          await x.ready;
          const svg = x.element;
          const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
          for (let u = 0; u <= 1.0001; u += 0.01) {
            x.seek(u * x.durationMs);
            const s0 = svg.getScreenCTM().a;
            for (const t of svg.querySelectorAll('text')) {
              if (t.closest('[data-layer="content-notice"]') || eff(t) < 0.05 || !(t.textContent || '').trim()) continue;
              const b = t.getBoundingClientRect();
              if (b.width < 0.5) continue;
              const fs = parseFloat(getComputedStyle(t).fontSize);
              const pxs = fs * (t.getScreenCTM().a / s0) * 1080 / Math.min(w, h);
              if (pxs < 16 - 0.05) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: "${t.textContent.slice(0, 20)}" ${pxs.toFixed(1)} px`);
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

// Coordinator decision (courts-02 review 1): no shipped preset or default supplies a directed link between bodies.
test(`${ID}: no shipped preset or default supplies a directed link between bodies`, async () => {
  const def = (await import('../../src/animations/courts/LAW-0208.js')).default;
  const bad = [];
  for (const pr of [{name: 'default', params: {}}, ...presetsFor(ID)]) {
    (pr.params.routes ?? def.defaultParams.routes).forEach((r, i) => { if (r.kind !== 'relation') bad.push(`${pr.name} routes[${i}] ${r.kind}`); });
  }
  expect(bad).toEqual([]);
});
