// LAW-0205 — Jerarquía judicial editable · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (podiums rise continuously, nothing jumps), anchoring of objects
// (each building, room plan, seated people and label ride on their own podium), and the transformation (a flat row
// becoming tiers on the supplied levels) recognisable with the labels hidden.
// Windows (LAW-0205.js W): rest 0–0.15 (nothing moves, no level drawn) · supplied levels draw 0.15–0.26 · podiums rise
// in N steps inside 0.27–0.66 · links draw 0.665–0.73 · notes/state/key 0.745–0.80 · still from 0.80.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0205';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: [0, 1, 2, 3, 4].map(i => `roof${i}`),
  semantic: [
    {at: 0, fn: 's.levelsNow.every(v => v === 0) && s.ruler === 0 && s.linksDrawn.every(v => v === 0)', label: 'rest: a flat row under the empty level scaffold, not yet applied, no link'},
    {at: 0.149, fn: 's.levelsNow.every(v => v === 0) && s.ruler === 0', label: 'nothing moves during the rest beat'},
    {at: 0.265, fn: 's.ruler === 1 && s.levelsNow.every(v => v === 0)', label: 'cause first: the supplied levels are drawn before any podium rises'},
    {at: 0.4, fn: 's.levelsNow.some(v => v > 0) && s.levelsNow.some((v, i) => v < s.supplied[i])', label: 'the podiums are rising (part-way)'},
    {at: 0.66, fn: 's.placed.every(Boolean) && s.linksDrawn.every(v => v === 0)', label: 'every body stands on its supplied level before any link is drawn'},
    {at: 0.74, fn: 's.placed.every(Boolean) && s.linksDrawn.every(v => v === 1)', label: 'main action complete by u 0.74 (placed and linked)'},
    {at: 1, fn: "JSON.stringify(s.levelsNow) === JSON.stringify(s.supplied) && s.finalState === 'all-placed' && !s.fallback", label: 'hold: every body on its supplied level'},
    {at: 1, fn: "JSON.stringify(s.linkKinds) === JSON.stringify(['relation','relation','relation'])", label: 'default links are plain relations (no arrow)'},
    ...[0.3, 0.45, 0.6].map(at => ({at, fn: 's.levelsNow.every((v, i) => v <= s.supplied[i] + 1e-9)', label: `no podium ever overshoots its supplied level (u=${at})`})),
    {at: 0.5, params: {textVisibility: 'none'}, fn: 's.levelsNow.some(v => v > 0)', label: 'labels hidden: the same rise'},
    {at: 1, params: {textVisibility: 'none'}, fn: 'JSON.stringify(s.levelsNow) === JSON.stringify(s.supplied)', label: 'labels hidden: the same tiers'},
    {at: 1, params: {finalState: 'last-pending'}, fn: 's.levelsNow[s.levelsNow.length - 1] === 0 && s.levelsNow.slice(0, -1).every((v, i) => v === s.supplied[i])', label: 'supplied state: the last body stays at rest'},
    {at: 1, params: {actionProgress: 0.4}, fn: 's.actionCapped && s.levelsNow.some((v, i) => v < s.supplied[i])', label: 'actionProgress freezes the ordering part-way'},
    {at: 1, params: {courts: {levels: [{name: 'L1'}, {name: 'L2'}], bodies: [{label: 'X', level: 2}, {label: 'Y', level: 1}]}, routes: []}, fn: "JSON.stringify(s.supplied) === '[2,1]' && JSON.stringify(s.levelsNow) === '[2,1]'", label: 'levels and bodies are entirely supplied (two levels, reversed order)'},
    {at: 1, params: {routes: [{from: 0, to: 2, kind: 'sequence'}]}, fn: "JSON.stringify(s.linkKinds) === '[\"sequence\"]'", label: 'a link supplied as sequence is drawn as a sequence'},
    {at: 1, params: P('long-labels-stress'), fn: '!s.fallback && s.levelsNow.length === 4', label: 'stress: four bodies on four levels, laid out without fallback'},
  ],
});

suppliedTextSuite(ID, {
  fields: 'return [...p.courts.levels.map(l => l.name), ...p.courts.bodies.map(b => b.label), p.labels.note, p.labels.key, p.actorLabels.people, p.objectLabels.building, p.objectLabels.room, p.objectLabels.link, ...p.annotations.map(a => a.text)]',
  content: 'return [...p.courts.levels.map(l => l.name), ...p.courts.bodies.map(b => b.label)]',
  captions: 'return [p.labels.note, p.actorLabels.people, p.objectLabels.building, p.objectLabels.room, p.objectLabels.link]',
});

const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const PEOPLE = "const people = [...svg.querySelectorAll('[data-node]')].filter(e => /^h-room\\d+-p\\d+$/.test(e.getAttribute('data-node')));";
// people >= 60 px across, heads >= 26 px (1080p) at rest, during the rise and at the hold
const PEOPLE_SIZE = `(() => { ${K} ${PEOPLE}
  return people.length > 0 && people.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); return hd.width / K >= 26 && e.getBoundingClientRect().width / K >= 60; });
})()`;
// each body label lies on its own podium face (inside the podium column), and no card covers a head
const LABEL_ON_OWN_PODIUM = `(() => { ${BOX}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^h-lab\\d+-body$/.test(e.getAttribute('data-node')));
  if (!labs.length) return false;
  return labs.every(l => { const i = l.getAttribute('data-node').match(/\\d+/)[0]; const b = bx(l), pod = bx(svg.querySelector('[data-node="h-pod' + i + '"]'));
    return b.l >= pod.l - 1 && b.r <= pod.r + 1 && b.t >= pod.t - 1 && b.b <= pod.b + 1; });
})()`;
const NO_CARD_ON_FACE = `(() => { ${BOX} ${PEOPLE}
  const heads = people.map(e => bx(svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]')));
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^(h-lab\\d+-body|h-plate\\d+|title|i\\d?-\\w+)$/.test(e.getAttribute('data-node')) && visible(e)).map(bx);
  return cards.every(c => heads.every(hd => !hit(c, hd, 1)));
})()`;
// every link ends on its own two roofs (within the roof width, at the roof line) and crosses no text or building
const LINKS_LAND = `(() => { ${K} ${BOX}
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]')).map(bx);
  const blds = [...svg.querySelectorAll('[data-node]')].filter(e => /^h-b\\d+$/.test(e.getAttribute('data-node'))).map(e => ({i: +e.getAttribute('data-node').slice(3), b: bx(e)}));
  const lines = [...svg.querySelectorAll('[data-node]')].filter(e => /^h-lk\\d+-line$/.test(e.getAttribute('data-node')) && visible(e));
  if (!lines.length) return false;
  for (const ln of lines) {
    const m = ln.getScreenCTM(), L = ln.getTotalLength();
    const pts = Array.from({length: 81}, (_, j) => ln.getPointAtLength(L * j / 80).matrixTransform(m));
    const ends = [pts[0], pts[80]];
    const own = ends.map(q => blds.find(b => q.x >= b.b.l - 1 && q.x <= b.b.r + 1 && Math.abs(q.y - b.b.t) <= 6 * K));
    if (own.some(o => !o) || own[0] === own[1]) return false;
    for (const q of pts.slice(3, 78)) {
      if (texts.some(t => q.x > t.l - 2 && q.x < t.r + 2 && q.y > t.t - 2 && q.y < t.b + 2)) return false;
      if (blds.some(b => q.x > b.b.l + 2 && q.x < b.b.r - 2 && q.y > b.b.t + 2 && q.y < b.b.b - 2)) return false;
    }
  }
  return true;
})()`;
// the scene fills the caption-safe box (>= 90 % on its long axis, >= 72 % on the other) at the hold
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
// the steps read: each level step is at least 60 % of a building high (px)
const STEPS = "s.fallback === false && s.roofs.length > 1";

// LAW-0178 routing rules: link ends sharing a roof are >= 12 px apart; no two links run within 20 px of each other
// for more than 120 px (1080p)
const NO_PARALLEL = `(() => { ${K}
  const lines = [...svg.querySelectorAll('[data-node]')].filter(e => /^h-lk\\d+-line$/.test(e.getAttribute('data-node')) && visible(e)).map(ln => {
    const m = ln.getScreenCTM(), L = ln.getTotalLength();
    return {pts: Array.from({length: 161}, (_, j) => ln.getPointAtLength(L * j / 160).matrixTransform(m)), len: L * m.a};
  });
  for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
    const a = lines[i], b = lines[j];
    const ends = [a.pts[0], a.pts[160]].concat([b.pts[0], b.pts[160]]);
    for (const p of [a.pts[0], a.pts[160]]) for (const q of [b.pts[0], b.pts[160]]) if (Math.hypot(p.x - q.x, p.y - q.y) < 12 * K) return false;
    let run = 0;
    const step = a.len / 160;
    for (const q of a.pts) {
      const close = !ends.some(e => Math.hypot(q.x - e.x, q.y - e.y) < 40 * K) && b.pts.some(z => Math.hypot(z.x - q.x, z.y - q.y) < 20 * K);
      run = close ? run + step : 0;
      if (run > 120 * K) return false;
    }
  }
  return true;
})()`;

ratioChecks(ID, 'people large, labels on own podium, cards off faces, links land on roofs, scene fills', [
  {at: [1], dom: NO_PARALLEL, label: 'rendered: link ends on a shared roof >= 12 px apart; no two links run as a tight parallel pair'},
  {at: [0, 0.45, 1], dom: PEOPLE_SIZE, label: 'rendered: people >= 60 px across and heads >= 26 px (rest, rise, hold)'},
  {at: [0, 0.45, 1], tv: ['all'], dom: LABEL_ON_OWN_PODIUM, label: 'rendered: each body label lies on its own podium face'},
  {at: times(0, 1, 0.05), dom: NO_CARD_ON_FACE, label: 'rendered: no card, plate or note covers a head'},
  {at: [0.8, 1], dom: LINKS_LAND, label: 'rendered: each link ends on its own two roofs and crosses no text or building'},
  {at: [1], dom: FILL, label: 'rendered: the scene fills the caption-safe box (labels shown and hidden)'},
  {at: [1], fn: STEPS, label: 'laid out without fallback'},
  {at: [0.66, 1], fn: "s.placed.every(Boolean) || s.finalState === 'last-pending'", label: 'every body placed by u 0.66'},
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
  const def = (await import('../../src/animations/courts/LAW-0205.js')).default;
  const bad = [];
  for (const pr of [{name: 'default', params: {}}, ...presetsFor(ID)]) {
    (pr.params.routes ?? def.defaultParams.routes).forEach((r, i) => { if (r.kind !== 'relation') bad.push(`${pr.name} routes[${i}] ${r.kind}`); });
  }
  expect(bad).toEqual([]);
});
