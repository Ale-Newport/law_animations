// LAW-0211 — Asignación de órgano · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact is modified (only the supplied datum on
// the file tag — and with it which mapping row, if any, names it, hence the route and where the file is set
// down), and no legal consequence is invented (no winner, score, tick or cross; the neutral note says no
// conclusion; the pending file simply waits in the dashed slot).
// Timing (u): identical base until the datum is written (0.19–0.30); scenario labels 0.34–0.40; the same clerk
// walks in parallel 0.42–0.58 (same windows in A and B); scan 0.58–0.64; A: route 0.64–0.68, walk 0.66–0.75,
// set down 0.75–0.78; B: walk to the slot 0.66–0.72, set down 0.72–0.75; guide 0.80–0.85; notes 0.82–0.87.
// coordinator decision 2026-09-26 (standing rule, AUTHORING item 20): the long-labels-stress field lengths are capped
// to the longest tried values that fit every ratio at >= 16 px. Every field stays strictly longer than baseline; counts
// >= baseline.
// Layout (all ratios): paired lanes — one shared row of every supplied venue, lane A (intake, road, sorting point with
// its slot opening towards the venue row) above it and lane B below it, drawn identically; each lane's clerk uses its
// own door of the chosen venue (A) or waits in its own slot (B). The plan spans the frame's width (>= 71 %, rendered);
// all texts sit below it. People: the courts "micro" person scale (1.2x the plan scale; 1.35x at 1:1), >= 60 px rendered.
// Guide: solid outlines of equal weight on both datum cards, solid leaders.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0211';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['Aclerk', 'Bclerk', 'Afile', 'Bfile'],
  attach: [
    ...['A', 'B'].map(k => ({from: 0, to: 0.715, a: `${k}file`, b: `${k}hands`, tol: 0.5})),
    ...['A', 'B'].map(k => ({from: 0.79, to: 1, a: `${k}file`, b: `${k}target`, tol: 0.5})),
  ],
  semantic: [
    {at: 0.1, fn: "s.scenes === 2 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.lookA.datum === '' && s.A.phase === 'intake'", label: 'base: two identical complete scenes; the datum line is still blank'},
    {at: 0.32, fn: "s.A.written === 1 && s.B.written === 1 && s.lookA.datum !== s.lookB.datum && s.A.phase === 'intake' && s.B.phase === 'intake'", label: 'the change: only the supplied datum differs; nobody has moved yet'},
    {at: 0.5, fn: "JSON.stringify(s.lookA.clerk) === JSON.stringify(s.lookB.clerk) && s.A.phase === 'walking' && s.B.phase === 'walking'", label: 'parallel: the same clerk at the same place in A and B'},
    {at: 0.65, fn: 's.A.matched === 1 && s.B.matched === 0 && s.A.selected === 1 && s.B.selected === -1', label: 'the supplied mapping names A\'s datum (Venue East) and no row names B\'s'},
    {at: 0.79, fn: 's.A.fileInTray && s.A.inVenue[1] && s.B.fileInSlot && s.B.inVenue.every(v => !v)', label: 'A: the file is in the venue\'s in-tray; B: it waits in the dashed slot — by u 0.79'},
    {at: 1, fn: 's.guideShown === 1 && s.noteShown === 1 && s.allReached && s.problems.length === 0', label: 'hold: the guide joins the changed detail; the neutral note is shown; the composition fits'},
    {at: 1, fn: "s.lookA.trail2To === 'venue1' && s.lookB.trail2To === 'slot'", label: 'the difference changes the route (geometry), not only text'},
    {at: 1, params: {scenarioB: {label: 'B', caption: 'x', datum: 'district = East (fictional)'}}, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'identical supplied data give identical scenes (nothing invented)'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.A.fileInTray && s.B.fileInSlot", label: 'labels hidden: the difference still reads'},
    {at: 1, params: P('contrast-or-alternative'), fn: 's.A.selected === 1 && s.B.selected === -1 && s.A.inVenue.length === 2', label: 'alternative: two venues; A names the second one, B is pending'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: "return [p.courts.origin, ...p.courts.venues.map(v => v.name), ...p.routes.filter(r => r.venue < p.courts.venues.length).map(r => r.datum), p.file.label, p.seats.arrival, p.seats.waiting, p.labels.junction, p.labels.datum, p.labels.key, p.scenarioA.label, p.scenarioA.caption, p.scenarioA.datum, p.scenarioB.label, p.scenarioB.caption, p.scenarioB.datum, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];",
  content: "return [...p.courts.venues.map(v => v.name), ...p.routes.filter(r => r.venue < p.courts.venues.length).map(r => r.datum), p.file.label, p.scenarioA.label, p.scenarioA.datum, p.scenarioB.label, p.scenarioB.datum, p.changedFact, ...p.sharedFacts];",
  captions: "return [p.labels.junction, p.seats.arrival, p.seats.waiting, p.scenarioA.caption, p.scenarioB.caption, p.comparisonLabels.neutral];",
});

const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const NO_CARD_ON_FACE = `(() => { ${K} ${BOX}
  const heads = ['A', 'B'].map(k => bx(svg.querySelector('[data-node="' + k + '-clerk-head"]')));
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^([AB]-vb\\d+|[AB]-card|guide-card|strip|[AB]-badge)$/.test(e.getAttribute('data-node')) && visible(e)).map(bx);
  return cards.every(c => heads.every(h => !hit(c, h, 1)));
})()`;
const PEOPLE_SIZE = `(() => { ${K}
  return ['A', 'B'].every(k => { const b = svg.querySelector('[data-node="' + k + '-clerk"]').getBoundingClientRect(); const hd = svg.querySelector('[data-node="' + k + '-clerk-head"]').getBoundingClientRect(); return Math.min(b.width, b.height) / K >= 60 && hd.width / K >= 26; });
})()`;
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
const EQUAL = "(() => { const a = svg.querySelector('[data-node=\"A-plan\"]').getBoundingClientRect(), b = svg.querySelector('[data-node=\"B-plan\"]').getBoundingClientRect(); return Math.abs(a.width - b.width) < 2 && Math.abs(a.height - b.height) < 2; })()";
// the plan node, measured on the page against the whole frame (not against the layout model)
const PLAN_BOX = "const vb = svg.viewBox.baseVal; const m = svg.getScreenCTM().inverse(); const r0 = svg.querySelector('[data-node=\"plan\"]').getBoundingClientRect(); const p1 = new DOMPoint(r0.left, r0.top).matrixTransform(m), p2 = new DOMPoint(r0.right, r0.bottom).matrixTransform(m);";
const PLAN_WIDE = `(() => { ${PLAN_BOX} return (p2.x - p1.x) / vb.width >= 0.71; })()`;
const PLAN_TALL = `(() => { ${PLAN_BOX} return (p2.y - p1.y) / vb.height >= 0.35; })()`;
// every venue (and each lane's door into it) and both waiting slots are drawn inside the frame
const VENUES_SHOWN = `(() => { ${K} ${BOX}
  const fr = bx(svg);
  const els = [...svg.querySelectorAll('[data-node]')].filter(e => /^ls-(venue\\d+|[AB]-vdoor\\d+|[AB]-slot)$/.test(e.getAttribute('data-node')));
  const venues = els.filter(e => /venue\\d/.test(e.getAttribute('data-node')));
  return venues.length >= 2 && els.length >= venues.length * 3 + 2 && els.every(e => { const b = bx(e); return visible(e) && b.l >= fr.l - 1 && b.r <= fr.r + 1 && b.t >= fr.t - 1 && b.b <= fr.b + 1 && (b.r - b.l) / K >= 40; });
})()`;
// equal weight: the two scene cards carry the same outlines (no highlight on one side only)
const SAME_DOORS = `(() => {
  const sig = k => [...svg.querySelectorAll('[data-node^="' + k + '-card"], [data-node^="' + k + '-scene"]')].map(e => [...e.querySelectorAll('path,rect')].filter(visible).map(q => (q.getAttribute('stroke') || '') + '|' + (q.getAttribute('stroke-width') || '') + '|' + (q.getAttribute('stroke-dasharray') || '')).join(',')).join(';');
  return sig('A') === sig('B');
})()`;
// the guide leaders cross no text and no head (their ends touch the datum cards and the guide card)
const GUIDE_CLEAN = `(() => { ${K} ${BOX}
  const heads = ['A', 'B'].map(k => bx(svg.querySelector('[data-node="' + k + '-clerk-head"]')));
  const g = svg.querySelector('[data-node="guide"]'); if (!g) return true;
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-node="guide"]') && !t.closest('[data-layer="content-notice"]')).map(bx);
  for (const path of g.querySelectorAll('[data-node^="guide-path"]')) {
    const m = path.getScreenCTM(), L = path.getTotalLength();
    for (let j = 2; j <= 58; j++) { const q = path.getPointAtLength((L * j) / 60).matrixTransform(m); if ([...texts, ...heads].some(o => q.x > o.l + 1 && q.x < o.r - 1 && q.y > o.t + 1 && q.y < o.b - 1)) return false; }
  }
  return true;
})()`;

ratioChecks(ID, 'equal scenes, large people, clean guide, text sizes', [
  {at: times(0, 1, 0.05), dom: NO_CARD_ON_FACE, label: 'rendered: no block, card, strip or guide card covers a head'},
  {at: [0, 0.5, 1], dom: PEOPLE_SIZE, label: 'rendered: both clerks >= 60 px across, heads >= 26 px (1080p)'},
  {at: [0, 1], dom: EQUAL, label: 'rendered: both plans drawn at the same size (equal weight)'},
  {at: [1], dom: FILL, label: 'rendered: the scenes and texts fill the caption-safe box'},
  {at: [1], tv: ['all'], dom: GUIDE_CLEAN, label: 'rendered: the guide leaders cross no text and no head'},
  {at: [0, 1], fn: "s.arrangement.startsWith('lanes/') && s.venuesShown === P.courts.venues.length", label: 'both scenes share one venue row that shows every supplied venue'},
  {at: [0, 0.5, 1], dom: VENUES_SHOWN, label: 'rendered: every venue, every venue door and both waiting slots are inside the frame at full size'},
  {at: [0, 0.5, 1], dom: PLAN_WIDE, label: 'rendered: the shared plan spans >= 71 % of the frame width in every preset × ratio'},
  {at: [0, 1], ratios: ['9:16'], dom: PLAN_TALL, label: 'rendered (9:16): the plan keeps >= 35 % of the frame height (the text never takes most of it)'},
  {at: [0, 1], dom: SAME_DOORS, label: 'rendered: A and B look the same before and after (no highlight on one side only)'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);

// Rendered (pattern of LAW-0194/0196/0688): EVERY visible text — key, legend, captions, headings, badges — is >= 16 px at
// 1080p at every sampled u in every preset × ratio, and >= 19.5 px in default, baseline-illustrative and baseline-es.
test(`${ID}: every visible text >= 16 px (>= 19.5 px in baseline and baseline-es) at every sampled u (all presets × ratios)`, async ({page}) => {
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
        for (let u = 0; u <= 1.0001; u += 0.02) {
          x.seek(u * x.durationMs);
          const s0 = svg.getScreenCTM().a;
          for (const t of svg.querySelectorAll('text')) {
            if (t.closest('[data-layer="content-notice"]') || eff(t) < 0.05 || !(t.textContent || '').trim()) continue;
            const b = t.getBoundingClientRect();
            if (b.width < 0.5) continue;
            const fs = parseFloat(getComputedStyle(t).fontSize);
            const pxs = fs * (t.getScreenCTM().a / s0) * 1080 / Math.min(w, h);
            const floor = ['default', 'baseline-illustrative', 'baseline-es'].includes(pr.name) ? 19.5 : 16;
            if (pxs < floor - 0.05) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: "${t.textContent.slice(0, 20)}" ${pxs.toFixed(1)} px < ${floor}`);
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
