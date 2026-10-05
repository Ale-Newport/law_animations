// LAW-0207 — Jerarquía judicial editable · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact is modified (only the level at which the
// configuration places the focus body — and with it its podium, building, links and link lanes), and no legal
// consequence is invented (no winner, score, tick or cross; the neutral note says no outcome, the key no conclusion).
// Windows (LAW-0207.js W): identical base until 0.17 · shared ruler 0.17–0.24 · target outlines 0.24–0.33 ·
// scenario labels 0.33–0.40 · podiums rise in parallel 0.42–0.70 · links 0.70–0.76 · guide 0.77–0.83 · notes 0.80–0.86.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0207';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['A', 'B'].flatMap(k => [0, 1, 2, 3].map(i => `${k}roof${i}`)),
  semantic: [
    {at: 0.1, fn: 's.scenes === 2 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.header === 0 && s.marker === 0', label: 'base: two identical complete scenes, no scenario label, no marker'},
    {at: 0.3, fn: 's.marker > 0 && s.lookA.targetLevel !== s.lookB.targetLevel && JSON.stringify(s.A.levels) === JSON.stringify(s.B.levels)', label: 'the change is introduced as a localized target outline; nothing has moved yet'},
    {at: 0.4, fn: 's.header === 1 && JSON.stringify(s.lookA.levels) === JSON.stringify(s.lookB.levels)', label: 'scenario labels shown; every non-focus body identical'},
    {at: 0.55, fn: 'JSON.stringify(s.lookA.levels) === JSON.stringify(s.lookB.levels) && s.A.levels.some(v => v > 0)', label: 'parallel: the same rise with the same timing in A and B (except the focus body)'},
    {at: 1, fn: 's.A.levels[s.focusBody] === s.levelA && s.B.levels[s.focusBody] === s.levelB && s.levelA !== s.levelB', label: 'the focus body stands on the level of its scenario (origin in A, configured review in B)'},
    {at: 1, fn: 'JSON.stringify(s.lookA.links) !== JSON.stringify(s.lookB.links)', label: 'the difference changes geometry (links and lanes), not only text or colour'},
    {at: 1, fn: 's.guideShown === 1 && s.noteShown === 1 && !s.fallback && s.allReached', label: 'guide joins the changed detail; neutral note shown'},
    {at: 1, params: {scenarioB: {label: 'B', caption: 'x', level: 1}}, fn: 'JSON.stringify(s.lookA.levels) === JSON.stringify(s.lookB.levels) && s.lookA.focus === s.lookB.focus && JSON.stringify(s.lookA.links) === JSON.stringify(s.lookB.links)', label: 'identical supplied placements give identical scenes (nothing invented)'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.A.levels[s.focusBody] !== s.B.levels[s.focusBody]', label: 'labels hidden: the difference still reads'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.focusBody === 0 && s.levelA === 2 && s.levelB === 3 && s.linkKinds.every(k => k === 'relation') && s.A.levels.length === 3", label: 'alternative: three levels and bodies, first body in focus (level 2 vs configured review level), plain links'},
    {at: 1, params: P('long-labels-stress'), fn: '!s.fallback && s.A.levels.length === 4', label: 'stress: four bodies laid out without fallback'},
    {at: 0, fn: 's.A.levels.length >= 3', label: 'the hierarchy has at least three bodies'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: 'return [...p.courts.levels.map(l => l.name), ...p.courts.bodies.map(b => b.label), p.labels.note, p.labels.key, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral]',
  content: 'return [...p.courts.levels.map(l => l.name), ...p.courts.bodies.map(b => b.label), p.scenarioA.label, p.scenarioB.label, p.changedFact, ...p.sharedFacts]',
  captions: 'return [p.scenarioA.caption, p.scenarioB.caption, p.comparisonLabels.guide, p.comparisonLabels.neutral, p.labels.note]',
});

const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const PEOPLE = "const people = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-room\\d+-p\\d+$/.test(e.getAttribute('data-node')));";
const PEOPLE_SIZE = `(() => { ${K} ${PEOPLE}
  return people.length > 0 && people.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); return hd.width / K >= 26 && e.getBoundingClientRect().width / K >= 60; });
})()`;
const LABEL_ON_OWN_PODIUM = `(() => { ${BOX}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-lab\\d+-body$/.test(e.getAttribute('data-node')));
  if (!labs.length) return false;
  return labs.every(l => { const nm = l.getAttribute('data-node'); const k = nm[0], i = nm.match(/\\d+/)[0]; const b = bx(l), pod = bx(svg.querySelector('[data-node="' + k + '-pod' + i + '"]'));
    return b.l >= pod.l - 1 && b.r <= pod.r + 1 && b.t >= pod.t - 1 && b.b <= pod.b + 1; });
})()`;
const NO_CARD_ON_FACE = `(() => { ${BOX} ${PEOPLE}
  const heads = people.map(e => bx(svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]')));
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^([AB]-lab\\d+-body|c-plate\\d+|[AB]-plate\\d+|c-title|guide-card|hdr[AB]-text|s\\d+-\\w+)$/.test(e.getAttribute('data-node')) && visible(e)).map(bx);
  return heads.length > 0 && cards.every(c => heads.every(hd => !hit(c, hd, 1)));
})()`;
// the guide leaders cross no text and no head
const GUIDE_CLEAN = `(() => { ${BOX} ${PEOPLE}
  const heads = people.map(e => bx(svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]')));
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-node="guide"]') && !t.closest('[data-layer="content-notice"]')).map(bx);
  const path = svg.querySelector('[data-node="guide-lead"]');
  if (!path) return false;
  const m = path.getScreenCTM(), L = path.getTotalLength();
  for (let j = 2; j <= 118; j++) { const q = path.getPointAtLength((L * j) / 120).matrixTransform(m); if ([...texts, ...heads].some(o => q.x > o.l - 2 && q.x < o.r + 2 && q.y > o.t - 2 && q.y < o.b + 2)) return false; }
  return true;
})()`;
const LINKS_LAND = `(() => { ${K} ${BOX}
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]')).map(bx);
  const blds = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-b\\d+$/.test(e.getAttribute('data-node'))).map(e => ({n: e.getAttribute('data-node'), b: bx(e)}));
  const lines = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-lk\\d+-line$/.test(e.getAttribute('data-node')) && visible(e));
  if (!lines.length) return false;
  for (const ln of lines) {
    const sc = ln.getAttribute('data-node')[0];
    const mine = blds.filter(b => b.n[0] === sc);
    const m = ln.getScreenCTM(), L = ln.getTotalLength();
    const pts = Array.from({length: 81}, (_, j) => ln.getPointAtLength(L * j / 80).matrixTransform(m));
    const own = [pts[0], pts[80]].map(q => mine.find(b => q.x >= b.b.l - 1 && q.x <= b.b.r + 1 && Math.abs(q.y - b.b.t) <= 6 * K));
    if (own.some(o => !o) || own[0] === own[1]) return false;
    for (const q of pts.slice(3, 78)) {
      if (texts.some(t => q.x > t.l - 2 && q.x < t.r + 2 && q.y > t.t - 2 && q.y < t.b + 2)) return false;
      if (blds.some(b => q.x > b.b.l + 2 && q.x < b.b.r - 2 && q.y > b.b.t + 2 && q.y < b.b.b - 2)) return false;
    }
  }
  return true;
})()`;
// equal visual weight: both scenes' buildings and podiums are drawn at the same size
const EQUAL = "(() => { const s = n => svg.querySelector('[data-node=\"' + n + '\"]').getBoundingClientRect(); return [0, 1, 2].every(i => { const a = s('A-b' + i), b = s('B-b' + i), pa = s('A-pod' + i), pb = s('B-pod' + i); return Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1 && Math.abs(pa.width - pb.width) < 1; }); })()";
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";

ratioChecks(ID, 'people large, labels own podiums, cards off faces, clean guide and links, equal scenes, fill', [
  {at: [0, 0.55, 1], dom: PEOPLE_SIZE, label: 'rendered: people >= 60 px across and heads >= 26 px (1080p)', presets: ['baseline-illustrative', 'contrast-or-alternative', 'long-labels-stress', 'baseline-es']},
  {at: [0, 0.55, 1], tv: ['all'], dom: LABEL_ON_OWN_PODIUM, label: 'rendered: each body label lies on its own podium face'},
  {at: times(0, 1, 0.05), dom: NO_CARD_ON_FACE, label: 'rendered: no label, plate, header, guide chip or note covers a head', presets: ['baseline-illustrative', 'contrast-or-alternative', 'long-labels-stress', 'baseline-es']},
  {at: [1], tv: ['all'], dom: GUIDE_CLEAN, label: 'rendered: the guide leaders cross no text and no head'},
  {at: [0.8, 1], dom: LINKS_LAND, label: 'rendered: each link ends on two roofs of its own scene and crosses no text or building'},
  {at: [0, 0.5, 1], dom: EQUAL, label: 'rendered: both scenes drawn at the same size (equal weight)'},
  {at: [1], dom: FILL, label: 'rendered: the two scenes and the strip fill the caption-safe box'},
  {at: [1], fn: 's.row ? s.panelShare >= 0.4 : s.panelShare >= 0.99', label: 'each scene >= 40 % of the width side by side, full width when stacked'},
  {at: [1], fn: '!s.fallback', label: 'laid out without fallback'},
]);

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
          for (let u = 0; u <= 1.0001; u += 0.02) {
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
  const def = (await import('../../src/animations/courts/LAW-0207.js')).default;
  const bad = [];
  for (const pr of [{name: 'default', params: {}}, ...presetsFor(ID)]) {
    (pr.params.routes ?? def.defaultParams.routes).forEach((r, i) => { if (r.kind !== 'relation') bad.push(`${pr.name} routes[${i}] ${r.kind}`); });
  }
  expect(bad).toEqual([]);
});
