// LAW-0256 — Comunicación a la contraparte · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens holds a second copy of the same stage
// coordinates, cropped to the inspected leg, its badge and the tag), the change is localised (only the leg's supplied
// state changes, and with it only the leg's outline and badge), and seeking back restores exactly the previous datum.
// Lens rules (AUTHORING line 109): the lens's smaller side >= 0.35 of the frame's short side; magnification >= 1.5x
// against the context AT REST (u 0.1); the context keeps >= 45 % of the frame width and context + lens span >= 80 %;
// the datum is shown in one place at a time (sequenced hand-over, never both >= 0.15, and never both illegible for
// more than 200 ms); fields wholly in or out of the lens; heads wholly in or out of the lens at every frame; the lens
// never covers a head or its own source; sequenced return (lens, then panel, then the Δ marker).
// In square and some tall frames the lens opens over the lower part of the context (desks, chairs, floor) below every
// head, neck and shoulders and below its source (LAW-0248 precedent); the context stays visible above it across the
// full width.
// Legal content: "questioned" means only that someone questions it in this configured example; the old value is kept
// as "was" (never struck, crossed or dimmed to a verdict); no service rule, valid method, deadline or effect.
// Windows (u): the end of the story 0–0.15 (Party B sets the file in her tray) · ring 0.05–0.13 · frame 0.20–0.24 ·
// panel out 0.215–0.24 · context steps back 0.221–0.271 · lens opens 0.24–0.30 · old value docks 0.46–0.50 · new value
// 0.505–0.535 · the solid outline and ● go 0.55–0.575, the dashed disputed marker and ◆ come 0.585–0.61 · lens closes
// 0.72–0.762 while the context returns 0.732–0.774 · panel back 0.748–0.778 · Δ 0.80–0.84.
// The long-labels-stress preset is not capped (every field at near-maximum length).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {CARDS_CLEAR, IN_FRAME, TEXT_OFF_BARS, NEUTRAL_MARKERS, HANDS_OFF_HEADS} from './requerimiento-previo-checks.js';
import {
  textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, headSizeTest, neutralityTest, noArrowsTest,
  seekHistoryTest, blankWindowTest, esDefaultsTest, figureSizeTest, chipsOffTest, fillTest, equalWeightTest, RATIOS,
} from './comunicacion-contraparte-checks.js';

const ID = 'LAW-0256';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['handB', 'file'],
  semantic: [
    {at: 0.1, fn: "s.datum === 'before' && s.lensOpen === 0 && s.contextScale === 1 && s.legState === 'documented'", label: 'build: the context in full, the supplied datum, the leg documented (●, solid outline); no lens'},
    {at: 0.16, fn: "s.docAt === 'B' && s.holder === 'trayB'", label: 'the end of the story: the file lies in Party B\'s tray'},
    {at: 0.4, fn: 's.lensOpen === 1 && s.zoom >= 1.5 && s.datumInLens && s.lensClearOfHeads && s.lensMinSideShare >= 0.35', label: 'isolate: a real enlargement (>= 1.5x the context at rest) holding the whole datum, clear of every head'},
    {at: 0.49, fn: "s.datum === 'changing' && s.oldDocked > 0 && s.legState === 'documented'", label: 'substitute: the old value moves to the "was" slot before anything else changes'},
    {at: 0.545, fn: "s.datum === 'after' && s.oldDocked === 1 && s.legState === 'documented'", label: 'the new value comes first; the leg\'s outline has not changed yet'},
    {at: 0.7, fn: "s.legState === 'questioned' && s.lensOpen === 1", label: 'then only the dependent geometry changes: the dashed disputed marker and ◆ on the same leg'},
    {at: 0.82, fn: "s.lensOpen === 0 && s.contextScale === 1 && s.datum === 'after'", label: 'return: the lens has closed onto the updated context at full size'},
    {at: 1, fn: "s.markerShown === 1 && s.datum === 'after' && s.legState === 'questioned' && s.problems.length === 0", label: 'hold: the new state, the old value kept as "was", the Δ marker; composition fits'},
    {at: 0.3, fn: "s.datum === 'before' && s.oldDocked === 0 && s.legState === 'documented'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.before === 'questioned' && s.after === 'documented' && s.legState === 'documented' && s.leg === 3", label: 'another supplied pair on the last leg: from questioned (◆) to documented (●); nothing else is inferred'},
    {at: 0.7, params: {textVisibility: 'none'}, fn: "s.legState === 'questioned' && s.lensOpen === 1", label: 'labels hidden: the same localised change is visible'},
    ...['long-labels-stress', 'baseline-es'].map(n => ({at: 1, params: P(n), fn: 's.problems.length === 0', label: `${n}: clean composition`})),
  ],
});

suppliedTextSuite(ID, {
  fields: 'return [...p.stages, ...p.dates.legs.slice(0, p.stages.length + 1), ...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, p.objectLabels.outTray, p.objectLabels.inTray, p.objectLabels.calendar, p.objectLabels.route, p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker];',
  content: 'return [p.beforeValue, p.afterValue];',
  captions: "return [p.objectLabels.route, 'As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

// ---------------------------------------------------------------------------------------------
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; };";
const OP = "const op = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };";
const VB = "const vb = svg.viewBox.baseVal; const m = svg.getScreenCTM().inverse(); const X = v => new DOMPoint(v, 0).matrixTransform(m).x; const Y = v => new DOMPoint(0, v).matrixTransform(m).y; const vbox = e => { const r0 = e.getBoundingClientRect(); const a = new DOMPoint(r0.left, r0.top).matrixTransform(m), b = new DOMPoint(r0.right, r0.bottom).matrixTransform(m); return {x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y}; };";
// the lens's SMALLER rendered side >= 0.35 of the frame's short side, and >= 1.5x its (stepped-back) source frame
const LENS_SIZE = `(() => { ${VB}
  const L = vbox(svg.querySelector('[data-node="lens-bg"]')), S = vbox(svg.querySelector('[data-node="src-frame"]'));
  return Math.min(L.w, L.h) / Math.min(vb.width, vb.height) >= 0.35 && L.w / S.w >= 1.5;
})()`;
// the changed datum field (old, was, new): every visible part lies wholly inside the lens window, the context copy hidden
const DATUM_IN_LENS = `(() => { ${OP}
  const L = svg.querySelector('[data-node="lens"]'); if (op(L) < 0.99) return true;
  const W = svg.querySelector('[data-node="lens-bg"]').getBoundingClientRect();
  const parts = ['lz-oldw', 'lz-was', 'lz-neww'].map(n => svg.querySelector('[data-node="' + n + '"]')).filter(e => e && op(e) > 0.05);
  if (!parts.length) return false;
  const inside = parts.every(e => { const b = e.getBoundingClientRect(); return b.left >= W.left - 1 && b.right <= W.right + 1 && b.top >= W.top - 1 && b.bottom <= W.bottom + 1; });
  return inside && op(svg.querySelector('[data-node="cx-wrap"]')) <= 0.01;
})()`;
// the context (the stage's wall and floor) keeps >= 45 % of the frame width at every u
const CTX = `const cb = svg.querySelector('[data-node="s-wall"]').getBoundingClientRect(); const cl = X(cb.left), cr = X(cb.right), ct = Y(cb.top), cbm = Y(cb.bottom);`;
const CONTEXT_WIDE = `(() => { ${VB} ${CTX} return (cr - cl) >= 0.45 * vb.width; })()`;
// while the lens is open, context + lens span >= 80 % of the frame width (side by side) or of the safe box's height
// (stacked; the safe box is 0.74 of the frame height)
const CONTEXT_LENS_SPAN = `(() => { ${VB} ${OP} ${CTX} const L = svg.querySelector('[data-node="lens"]'); if (op(L) < 0.99) return true; const b = svg.querySelector('[data-node="lens-bg"]').getBoundingClientRect(); const hs = (Math.max(cr, X(b.right)) - Math.min(cl, X(b.left))) / vb.width, vs = (Math.max(cbm, Y(b.bottom)) - Math.min(ct, Y(b.top))) / (vb.height * 0.74); return hs >= 0.8 || vs >= 0.8; })()`;
// the lens window never lies over a head of the context, nor over its own source frame (whether it may lie over the
// lower context is the layout's choice, checked on the semantics: lensClearOfContext)
const LENS_CLEAR = `(() => { ${OP} ${BOX}
  const L = svg.querySelector('[data-node="lens"]'); if (op(L) < 0.02) return true;
  const lb = bx(svg.querySelector('[data-node="lens-bg"]'));
  const hit = (a, b) => a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1;
  const heads = ['s-pa-head', 's-pb-head'].map(n => bx(svg.querySelector('[data-node="' + n + '"]')));
  const src = svg.querySelector('[data-node="src-frame"]');
  if (src && op(src) > 0.05 && hit(lb, bx(src))) return false;
  return heads.every(hd => !hit(lb, hd));
})()`;
// guides start on the source frame, end on the lens window and cross no text and no head
const GUIDES = `(() => { ${BOX} ${OP}
  const src = svg.querySelector('[data-node="src-frame"]');
  if (!src || op(src) < 0.5) return true;
  const sb = bx(src), lb = bx(svg.querySelector('[data-node="lens-bg"]'));
  const obst = [...svg.querySelectorAll('text')].filter(t => op(t) > 0.05 && (t.textContent || '').trim() && !t.closest('[data-node="lens"]') && !t.closest('[data-layer="content-notice"]')).map(bx);
  obst.push(...['s-pa-head', 's-pb-head'].map(n => bx(svg.querySelector('[data-node="' + n + '"]'))));
  const near = (q, b) => q.x >= b.l - 3 && q.x <= b.r + 3 && q.y >= b.t - 3 && q.y <= b.b + 3;
  const guides = [...svg.querySelectorAll('[data-node^="guide"]')].filter(e => op(e) > 0.05);
  for (const gd of guides) {
    const mm = gd.getScreenCTM();
    const A = new DOMPoint(+gd.getAttribute('x1'), +gd.getAttribute('y1')).matrixTransform(mm), B = new DOMPoint(+gd.getAttribute('x2'), +gd.getAttribute('y2')).matrixTransform(mm);
    if (!near(A, sb) || !near(B, lb)) return false;
    for (let j = 2; j < 28; j++) { const q = {x: A.x + (B.x - A.x) * j / 30, y: A.y + (B.y - A.y) * j / 30}; if (obst.some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b)) return false; }
  }
  return true;
})()`;
// through the return and hold the new value and the kept old value stay visible at >= 16 px
const VALUE_TRACE = `(() => { ${OP}
  const s0 = svg.getScreenCTM().a; const vb = svg.viewBox.baseVal;
  const px = t => parseFloat(getComputedStyle(t).fontSize) * t.getScreenCTM().a / s0 * 1080 / Math.min(vb.width, vb.height);
  const parts = ['cx-neww', 'cx-oldw'].map(n => svg.querySelector('[data-node="' + n + '"]'));
  return parts.every(e => e && op(e) > 0.6) && parts.flatMap(e => [...e.querySelectorAll('text')]).every(t => px(t) >= 16);
})()`;
// the two badge glyphs (● and ◆, one shown at a time) have equal ink, and the two outlines of the leg the same box
const STATE_WEIGHT = `(() => {
  const bb = n => svg.querySelector('[data-node="' + n + '"]').getBBox();
  const a = bb('s-bd-documented-glyph'), b = bb('s-bd-questioned-glyph');
  const ia = Math.PI * (a.width / 2) ** 2, ib = a.width && b.width ? b.width * b.height / 2 : 0;
  const ma = bb('s-mk-documented'), mb = bb('s-mk-questioned');
  return ib > 0 && Math.max(ia, ib) / Math.min(ia, ib) <= 1.05 && Math.abs(ma.width - mb.width) < 0.5 && Math.abs(ma.height - mb.height) < 0.5;
})()`;

ratioChecks(ID, 'lens: real zoom vs rest, size, context kept, datum in one place, guides anchored; value traceable', [
  {at: [0.1, 1], fn: 's.contextScale === 1 && s.lensOpen === 0', label: 'build and hold: the context at full size, no lens'},
  {at: [0.4, 0.6], fn: 's.lensOpen === 1 && s.contextDim < 1', label: 'lens open: the context stays in view, dimmed in place'},
  {at: times(0.2, 0.8, 0.01), fn: 's.lensClearOfHeads && s.lensClearOfContext', label: 'the lens never covers a head (nor the context, unless it opens over its lower part)'},
  {at: times(0.2, 0.8, 0.01), dom: LENS_CLEAR, label: 'rendered: the lens window never lies over a head or its source frame'},
  {at: times(0, 1, 0.01), dom: CONTEXT_WIDE, label: 'rendered: the context keeps >= 45 % of the frame width at every u'},
  {at: times(0.3, 0.72, 0.01), tv: ['all'], dom: DATUM_IN_LENS, label: 'rendered: while the lens is open the datum field (old, "was", new) is wholly inside it and the context copy is hidden'},
  {at: [0.35, 0.5, 0.65], dom: LENS_SIZE, label: 'rendered: the lens window\'s smaller side >= 35 % of the frame\'s short side and >= 1.5x its source frame'},
  {at: times(0.3, 0.72, 0.02), dom: CONTEXT_LENS_SPAN, label: 'rendered: while the lens is open, context + lens span >= 80 % of the frame width or of the safe height'},
  {at: [0.3, 0.5, 0.7], dom: GUIDES, label: 'rendered: guides start on the source frame, end on the lens and cross no text or head'},
  {at: times(0.81, 1, 0.01), tv: ['all'], dom: VALUE_TRACE, label: 'rendered: through the return and hold the new value and the kept old value stay visible at >= 16 px'},
  {at: [0.4, 0.5, 0.6, 0.7], fn: 's.zoom >= 1.5 && s.lensOpen === 1 && s.datumInLens', label: 'the lens enlarges >= 1.5x against the context at rest and holds the whole datum'},
  {at: [0.54, 0.6, 0.66, 0.7], tv: ['all'], fn: "s.newShown === 1 && s.lensOpen === 1 && s.datum === 'after'", label: 'the new value is readable and still in the lens for >= 400 ms (u 0.535–0.72)'},
  {at: [1], fn: 's.markerShown === 1', label: 'the Δ marker is shown at the hold'},
  {at: [0.1, 1], dom: STATE_WEIGHT, label: 'rendered: ● and ◆ badge glyphs of equal ink; the solid and the dashed outline share one box'},
  {at: [0, 0.35, 0.6, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02)'},
  {at: [0, 0.5, 1], dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: times(0, 0.16, 0.01), dom: HANDS_OFF_HEADS, label: 'RENDERED: the hands never lie over a head (Party B takes and lowers the file)'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);

// The detail keeps its source coordinates (brief acceptanceCheck): the lens copies of the leg's badge and outline lie
// where the crop maps the context copies AT REST — dest + (rest position − crop) × zoom — within 1.5 px (u 0.5 vs 0.1).
test(`${ID}: the lens copy sits at the context's own coordinates × zoom (rendered, all presets × ratios × labels)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const {bad, worst} = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const out = [];
    let worst = 0;
    for (const pr of presets) for (const tv of [null, 'none']) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: tv ? {...pr.params, textVisibility: tv} : pr.params});
      await x.ready;
      const svg = x.element;
      // (design units = the scene layer's own coordinates, where the layout's crop and dest live)
      const inv = () => svg.querySelector('[data-layer="scene"]').getScreenCTM().inverse();
      const vbox = e => { const r0 = e.getBoundingClientRect(), m = inv(); const a = new DOMPoint(r0.left, r0.top).matrixTransform(m), b = new DOMPoint(r0.right, r0.bottom).matrixTransform(m); return {x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y}; };
      const pairs = [['s-bd-disc', 'lz-bd-disc'], ['s-mk-documented', 'lz-mk-documented']];
      x.seek(0.1 * x.durationMs);
      const rest = pairs.map(([a]) => vbox(svg.querySelector(`[data-node="${a}"]`)));
      x.seek(0.5 * x.durationMs);
      const s = x.getState({bounds: false}).semantic;
      // (the lens content is clipped: compare the unclipped geometry through getBBox and the CTM)
      pairs.forEach(([, b], i) => {
        const e = svg.querySelector(`[data-node="${b}"]`);
        const bb = e.getBBox(), m = inv().multiply(e.getScreenCTM());
        const p0 = new DOMPoint(bb.x, bb.y).matrixTransform(m), p1 = new DOMPoint(bb.x + bb.width, bb.y + bb.height).matrixTransform(m);
        const got = {x: Math.min(p0.x, p1.x), y: Math.min(p0.y, p1.y)};
        const exp = {x: s.dest.x + (rest[i].x - s.crop.x) * s.zoom, y: s.dest.y + (rest[i].y - s.crop.y) * s.zoom};
        const d = Math.hypot(got.x - exp.x, got.y - exp.y);
        worst = Math.max(worst, d);
        if (d > 1.5 * s.zoom) out.push(`${pr.name}${tv ? ' (labels hidden)' : ''} ${ratio} ${b}: off by ${d.toFixed(1)} units`);
      });
      x.destroy(); el.remove();
    }
    return {bad: out, worst};
  }, [ID, presets, RATIOS]);
  console.log(`[civil-claim-04] ${ID} lens copy vs rest × zoom, worst offset: ${worst.toFixed(2)} viewBox units`);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Magnification against the context AT REST (AUTHORING line 109): the stage's scale in the lens (lz-wall) at u 0.5 ÷
// its scale at u 0.1 (s-wall), and the datum's text in the lens at u 0.5 ÷ the same text in the context at u 0.1.
test(`${ID}: the lens magnifies >= 1.5x against the context at rest (rendered, u 0.5 vs u 0.1, all presets × ratios × labels)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const {bad, worst} = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const out = [];
    let worst = Infinity;
    for (const pr of presets) for (const tv of [null, 'none']) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: tv ? {...pr.params, textVisibility: tv} : pr.params});
      await x.ready;
      const svg = x.element;
      const sc = e => { if (!e) return NaN; const m = e.getScreenCTM(); return Math.hypot(m.a, m.b); };
      const fsz = e => (e ? parseFloat(getComputedStyle(e).fontSize) * sc(e) : NaN);
      x.seek(0.1 * x.durationMs);
      const c0 = sc(svg.querySelector('[data-node="s-wall"]')), t0 = fsz(svg.querySelector('[data-node="cx-old-text"] text, text[data-node="cx-old-text"]'));
      x.seek(0.5 * x.durationMs);
      const c1 = sc(svg.querySelector('[data-node="lz-wall"]')), t1 = fsz(svg.querySelector('[data-node="lz-old-text"] text, text[data-node="lz-old-text"]'));
      const tag = `${pr.name}${tv ? ' (labels hidden)' : ''} ${ratio}`;
      worst = Math.min(worst, c1 / c0);
      if (!(c1 / c0 >= 1.5)) out.push(`${tag}: stage in the lens ÷ at rest = ${(c1 / c0).toFixed(2)}`);
      if (!tv && !(t1 / t0 >= 1.5)) out.push(`${tag}: datum text in the lens ÷ at rest = ${(t1 / t0).toFixed(2)}`);
      x.destroy(); el.remove();
    }
    return {bad: out, worst};
  }, [ID, presets, RATIOS]);
  console.log(`[civil-claim-04] ${ID} worst magnification vs rest: ${worst.toFixed(2)}`);
  expect(bad, bad.join('\n')).toEqual([]);
});

// One copy of the datum at a time, and the hand-over in step with the lens (AUTHORING line 109; civil-claim-01
// LAW-0244): the context copy and the lens copy are never both >= 0.15 opacity, and the stretch where NEITHER copy of
// the value text is legible (both < 0.15) lasts <= 200 ms — at 60 fps over the open and the close, every preset × ratio.
test(`${ID}: one copy of the datum at a time; hand-over gaps <= 200 ms on the value text (60 fps, open and close)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const {bad, worstGap} = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const out = [];
    let worstGap = 0;
    for (const pr of presets) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      const svg = x.element;
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
      const textOp = sel => Math.max(0, ...[...svg.querySelectorAll(sel + ' text')].filter(t => (t.textContent || '').trim()).map(eff));
      for (const [u0, u1] of [[0.2, 0.34], [0.66, 0.86]]) {
        let run = 0, worst = 0, n = 0;
        for (let ms = u0 * x.durationMs; ms <= u1 * x.durationMs; ms += 1000 / 60) {
          x.seek(ms);
          const a = textOp('[data-node="cx-stack"]'), b = textOp('[data-node="lz-stack"]');
          n++;
          if (a >= 0.15 && b >= 0.15) out.push(`${pr.name} ${ratio} at ${Math.round(ms)} ms: context copy ${a.toFixed(2)}, lens copy ${b.toFixed(2)}`);
          run = a < 0.15 && b < 0.15 ? run + 1000 / 60 : 0;
          worst = Math.max(worst, run);
        }
        worstGap = Math.max(worstGap, worst);
        if (worst > 200) out.push(`${pr.name} ${ratio} (${u0}–${u1}): neither copy legible for ${Math.round(worst)} ms`);
        if (n < 20) out.push(`${pr.name} ${ratio}: too few samples`);
      }
      x.destroy(); el.remove();
    }
    return {bad: [...new Set(out)].slice(0, 30), worstGap};
  }, [ID, presets, RATIOS]);
  console.log(`[civil-claim-04] ${ID} worst hand-over gap (neither copy legible): ${Math.round(worstGap)} ms`);
  expect(bad, bad.join('\n')).toEqual([]);
});

// The lens rim cuts no text: every text in the lens copy is wholly inside the window or wholly outside it (every
// 20 ms over u 0.20–0.80, labels shown), and there is lens text to check.
test(`${ID}: lens rim — no copy line cut, fields wholly in or out (rendered, every 20 ms)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, ps, ratios]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of ps) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      const svg = x.element;
      const q = n => svg.querySelector(`[data-node="${n}"]`);
      let texts = 0;
      for (let u = 0.2; u <= 0.8 + 1e-9; u += 20 / x.durationMs) {
        x.seek(u * x.durationMs);
        const lens = q('lens');
        if (parseFloat(lens.getAttribute('opacity') || 0) <= 0.02) continue;
        const win = q('lens-bg').getBoundingClientRect();
        for (const t of q('lens-content').querySelectorAll('text')) {
          let hidden = false;
          for (let e = t; e && e !== lens; e = e.parentElement) if (e.getAttribute && e.getAttribute('opacity') === '0') hidden = true;
          if (hidden || !(t.textContent || '').trim()) continue;
          const b = t.getBoundingClientRect();
          const inside = b.left >= win.left - 1 && b.right <= win.right + 1 && b.top >= win.top - 1 && b.bottom <= win.bottom + 1;
          const touching = b.left < win.right && b.right > win.left && b.top < win.bottom && b.bottom > win.top;
          texts++;
          if (touching && !inside) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: "${t.textContent.slice(0, 24)}" cut by the rim`);
        }
      }
      if (!texts) out.push(`${pr.name} ${ratio}: no lens text found (vacuous)`);
      x.destroy(); el.remove();
    }
    return [...new Set(out)].slice(0, 30);
  }, [ID, presets, RATIOS]);
  expect(bad, bad.join('\n')).toEqual([]);
});

// The lens is never a faint, blank outline: every partly transparent stretch lasts < 150 ms (every 10 ms).
test(`${ID}: lens opacity — no faint phase >= 150 ms (every 10 ms, all presets × ratios)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      const svg = x.element;
      let run = 0;
      for (let ms = 0.2 * x.durationMs; ms <= 0.8 * x.durationMs; ms += 10) {
        x.seek(ms);
        const o = parseFloat(svg.querySelector('[data-node="lens"]').getAttribute('opacity') ?? 0);
        run = o > 0.02 && o < 0.99 ? run + 10 : 0;
        if (run >= 150) { out.push(`${pr.name} ${ratio}: faint lens for ${run} ms at ${Math.round(ms)} ms`); break; }
      }
      x.destroy(); el.remove();
    }
    return out;
  }, [ID, presets, RATIOS]);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Heads wholly in or out of the lens at every frame: each lens copy of a head (lz-pa-head, lz-pb-head) is either wholly
// inside the lens window or wholly outside it, at 60 fps over the whole run, every preset × ratio × labels shown/hidden.
test(`${ID}: lens rim — every head is wholly in or out of the lens at every frame (60 fps, all presets × ratios × labels)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) for (const tv of ['all', 'none']) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const q = n => svg.querySelector(`[data-node="${n}"]`);
      const eff = e => { let o = 1; for (let z = e; z && z !== svg; z = z.parentNode) { const a = z.getAttribute && z.getAttribute('opacity'); if (a !== null && a !== undefined && a !== '') o *= parseFloat(a); } return o; };
      const cut = [];
      for (let ms = 0; ms <= x.durationMs + 0.01; ms += 1000 / 60) {
        x.seek(ms);
        if (eff(q('lens')) <= 0.02) continue;
        const L = q('lens-bg').getBoundingClientRect();
        for (const n of ['lz-pa-head', 'lz-pb-head']) {
          const hd = q(n); if (!hd || eff(hd) <= 0.02) continue;
          const b = hd.getBoundingClientRect();
          const inside = b.left >= L.left - 0.5 && b.right <= L.right + 0.5 && b.top >= L.top - 0.5 && b.bottom <= L.bottom + 0.5;
          const apart = b.right <= L.left + 0.5 || b.left >= L.right - 0.5 || b.bottom <= L.top + 0.5 || b.top >= L.bottom - 0.5;
          if (!inside && !apart) cut.push(`${n}@${Math.round(ms)}`);
        }
      }
      if (cut.length) out.push(`${pr.name} ${tv} ${ratio}: head cut by the rim at ${cut.length} frames (${cut.slice(0, 6).join(', ')})`);
      x.destroy(); el.remove();
    }
    return out;
  }, [ID, presets, RATIOS]);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Sequenced return: the lens has gone (opacity 0) before the panel is back at full strength and before the Δ marker
// starts; the context copy of the datum returns only after the lens copy has stopped being legible (every 10 ms).
test(`${ID}: sequenced return — lens, then panel, then Δ (every 10 ms, all presets × ratios)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      const svg = x.element;
      const op = n => { const e = svg.querySelector(`[data-node="${n}"]`); if (!e) return null; let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
      for (let ms = 0.7 * x.durationMs; ms <= 0.9 * x.durationMs; ms += 10) {
        x.seek(ms);
        const lens = op('lens'), panel = op('panel'), mk = op('cx-marker');
        if (lens > 0.02 && panel !== null && panel > 0.99 && s0(svg)) out.push(`${pr.name} ${ratio}: panel full while the lens shows (${Math.round(ms)} ms)`);
        if (lens > 0.02 && mk !== null && mk > 0.02) out.push(`${pr.name} ${ratio}: Δ while the lens shows (${Math.round(ms)} ms)`);
      }
      x.destroy(); el.remove();
    }
    function s0(svg) { const lb = svg.querySelector('[data-node="lens-bg"]').getBoundingClientRect(); return [...svg.querySelectorAll('[data-node="panel"] [data-node$="-card"]')].some(c => { const b = c.getBoundingClientRect(); return b.left < lb.right && b.right > lb.left && b.top < lb.bottom && b.bottom > lb.top; }); }
    return [...new Set(out)].slice(0, 20);
  }, [ID, presets, RATIOS]);
  expect(bad, bad.join('\n')).toEqual([]);
});

const PROPS = '[data-node="s-ta-back"], [data-node="s-ta-front"], [data-node="s-tb-back"], [data-node="s-tb-front"], [data-node="s-file"], [data-node="s-carrier"], [data-node^="s-stop"], [data-node="s-calg"], [data-node="s-da-desk"], [data-node="s-db-desk"], [data-node="s-rail"], [data-node="s-bd"]';
textFloorTest(ID, {step: 0.01});
inFrameTest(ID, {step: 0.005, clipped: ['[data-node="lens-bg"]']});
noOverlapTest(ID, {step: 0.01, opaque: ['[data-node="lens"]'], markers: ['[data-node="cx-marker"]', '[data-node="s-bd"]', '[data-node="s-file"]']});
// (full-body floors on the rendered FIGURE height, coordinator 2026-10-04: 60 px at rest, 45 px while the lens is open)
figureSizeTest(ID, {min: 60, lensMin: 45, lens: [0.19, 0.795], step: 0.02});
chipsOffTest(ID, {chips: '[data-node="key"], [data-node="context-caption"], [data-node^="panel-"]:not([data-node$="-wrap"]):not([data-node$="-card"]):not([data-node$="-text"]):not([data-node$="-cue"]), [data-node="marker-note"], [data-node="cx-old"], [data-node="cx-new"]', props: PROPS, step: 0.02});
// (the two states the leg can carry: the same outline box and weight, badge glyphs of equal ink)
equalWeightTest(ID, {chips: [['[data-node="cx-old"]', '[data-node="cx-new"]']], marks: [['[data-node="cx-old-cue"]', '[data-node="cx-new-cue"]']], at: [1], tag: ' — old and new values at the hold'});
fillTest(ID, {at: [0.1, 0.5, 1], a: 0.85, b: 0.5});
neutralityTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID);
blankWindowTest(ID, {selectors: ['[data-node="s-wall"]', '[data-node="panel"]', '[data-node="lens-bg"]', '[data-node="cx-wrap"]']});
coldCreateTest(ID);
esDefaultsTest(ID);

// The lens is never over a head of the context at ANY opacity (60 fps over the whole run, every preset × ratio × labels):
// the lens window's rendered box (any opacity > 0) never intersects s-pa-head / s-pb-head.
test(`${ID}: the lens never lies over a context head at any opacity (60 fps, all presets × ratios × labels)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) for (const tv of ['all', 'none']) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element, q = n => svg.querySelector(`[data-node="${n}"]`);
      for (let ms = 0; ms <= x.durationMs + 0.01; ms += 1000 / 60) {
        x.seek(ms);
        if (parseFloat(q('lens').getAttribute('opacity') || 0) <= 0) continue;
        const L = q('lens-bg').getBoundingClientRect();
        for (const n of ['s-pa-head', 's-pb-head']) {
          const b = q(n).getBoundingClientRect();
          if (Math.min(L.right, b.right) - Math.max(L.left, b.left) > 0.5 && Math.min(L.bottom, b.bottom) - Math.max(L.top, b.top) > 0.5) { out.push(`${pr.name} ${tv} ${ratio} ${Math.round(ms)} ms: lens over ${n}`); break; }
        }
      }
      x.destroy(); el.remove();
    }
    return [...new Set(out)].slice(0, 20);
  }, [ID, presets, RATIOS]);
  expect(bad, bad.join('\n')).toEqual([]);
});
