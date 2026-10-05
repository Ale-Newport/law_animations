// LAW-0203 — Distribución de una sala · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact is modified (only the supplied
// arrangement of the two table units — and with it where their chairs are and the routes to them), and no
// legal consequence is invented (no winner, score, tick or cross; the neutral note says no conclusion).
// Timing (u): identical base until the tables move (0.19–0.36); scenario labels 0.36–0.40; the same people
// walk in parallel inside 0.42–0.74 with the same windows in A and B; the seat labels arrive once everyone has
// sat down (0.74–0.80, in entrance order); guide 0.77–0.83; notes 0.80–0.85.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0203';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const PEOPLE = ['A', 'B'].flatMap(k => [0, 1, 2, 3].map(i => `${k}p${i}`));

contractSuite(ID, {
  continuity: PEOPLE,
  attach: ['A', 'B'].flatMap(k => [0, 1, 2].map(i => ({from: 0.76, to: 1, a: `${k}p${i}`, b: `${k}seat${i}`, tol: 0.5}))),
  semantic: [
    {at: 0.1, fn: "s.scenes === 2 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.lookA.header === 0 && s.A.states.every(x => x === 'waiting')", label: 'base: two identical complete scenes, nobody moved, no scenario label yet'},
    {at: 0.28, fn: "s.move > 0 && s.move < 1 && JSON.stringify(s.lookA.units) !== JSON.stringify(s.lookB.units) && s.A.states.every(x => x === 'waiting') && s.B.states.every(x => x === 'waiting')", label: 'the change: only the tables move (differently in A and B); people still wait'},
    {at: 0.4, fn: "s.move === 1 && s.lookA.header === 1 && s.lookB.header === 1 && JSON.stringify(s.lookA.people) === JSON.stringify(s.lookB.people)", label: 'the scenario labels appear after the change; people unchanged'},
    {at: 0.55, fn: "JSON.stringify(s.A.states) === JSON.stringify(s.B.states)", label: 'parallel: the same people are at the same stage of their walk in A and B'},
    {at: 1, fn: "s.A.states.every(x => x === 'seated') && s.B.states.every(x => x === 'seated') && s.A.labels.every(l => l === 1) && s.B.labels.every(l => l === 1)", label: 'both: everyone seated, every label shown'},
    {at: 1, fn: "s.layoutA !== s.layoutB && JSON.stringify(s.lookA.units) !== JSON.stringify(s.lookB.units)", label: 'the supplied arrangements differ (geometry, not only text)'},
    {at: 1, fn: 's.guideShown === 1 && s.noteShown === 1 && s.allReached', label: 'guide joins the changed detail; neutral note shown'},
    {at: 1, params: {scenarioB: {label: 'B', caption: 'x', layout: 'facing'}}, fn: "JSON.stringify(s.lookA) === JSON.stringify(s.lookB)", label: 'identical supplied arrangements give identical scenes (nothing invented)'},
    {at: 1, params: {textVisibility: 'none'}, fn: "JSON.stringify(s.lookA.units) !== JSON.stringify(s.lookB.units) && s.A.states.every(x => x === 'seated')", label: 'labels hidden: the difference still reads'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.layoutA === 'angled' && s.layoutB === 'side-by-side' && s.A.states.length === 4", label: 'alternative: angled vs side by side, four people'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: "const seats = p.routes.map(r => p.seats[r.seat] && p.seats[r.seat].label).filter(Boolean); return [p.courts.building, p.courts.room, ...seats, p.labels.mainDoor, p.labels.sideDoor, p.labels.key, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];",
  content: "const seats = p.routes.map(r => p.seats[r.seat] && p.seats[r.seat].label).filter(Boolean); return [...seats, p.scenarioA.label, p.scenarioB.label, p.changedFact, ...p.sharedFacts];",
  captions: "return [p.scenarioA.caption, p.scenarioB.caption, p.comparisonLabels.guide, p.comparisonLabels.neutral, p.labels.mainDoor, p.labels.sideDoor];",
});

const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const HEADS = "const heads = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-p\\d+-head$/.test(e.getAttribute('data-node'))).map(bx);";
const NO_CARD_ON_FACE = `(() => { ${K} ${BOX} ${HEADS}
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^([AB]-lab\\d+-body|hdr\\d|guide-card|strip)$/.test(e.getAttribute('data-node')) && visible(e)).map(bx);
  return heads.length > 0 && cards.every(c => heads.every(h => !hit(c, h, 1)));
})()`;
const LABEL_OWNS_SEAT = `(() => { ${K} ${BOX} ${HEADS}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-lab\\d+$/.test(e.getAttribute('data-node')) && visible(e));
  if (!labs.length) return false;
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
  for (const lab of labs) {
    const nm = lab.getAttribute('data-node');
    const body = bx(svg.querySelector('[data-node="' + nm + '-body"]'));
    const pb = bx(svg.querySelector('[data-node="' + lab.getAttribute('data-owner') + '"]'));
    const gap = Math.max(0, Math.max(pb.l - body.r, body.l - pb.r), Math.max(pb.t - body.b, body.t - pb.b)) / K;
    if (gap > 40) return false;
    const line = svg.querySelector('[data-node="' + nm + '-lead"]');
    const m = line.getScreenCTM();
    const A = new DOMPoint(+line.getAttribute('x1'), +line.getAttribute('y1')).matrixTransform(m), B = new DOMPoint(+line.getAttribute('x2'), +line.getAttribute('y2')).matrixTransform(m);
    if (!(B.x >= pb.l - 2 && B.x <= pb.r + 2 && B.y >= pb.t - 2 && B.y <= pb.b + 2)) return false;
    const pts = Array.from({length: 12}, (_, j) => ({x: A.x + (B.x - A.x) * (0.1 + 0.8 * j / 11), y: A.y + (B.y - A.y) * (0.1 + 0.8 * j / 11)}));
    const others = [...texts.filter(t => !lab.contains(t)).map(bx), ...heads];
    if (pts.some(q => others.some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b))) return false;
  }
  return true;
})()`;
// the guide leaders cross no text and no head (they end on their own scene's outline)
const GUIDE_CLEAN = `(() => { ${K} ${BOX} ${HEADS}
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-node="guide"]') && !t.closest('[data-layer="content-notice"]')).map(bx);
  for (const path of svg.querySelectorAll('[data-node^="guide-lead"]')) {
    const m = path.getScreenCTM(), L = path.getTotalLength();
    for (let j = 3; j <= 57; j++) { const q = path.getPointAtLength((L * j) / 60).matrixTransform(m); if ([...texts, ...heads].some(o => q.x > o.l - 2 && q.x < o.r + 2 && q.y > o.t - 2 && q.y < o.b + 2)) return false; }
  }
  return true;
})()`;
// owner proximity (per scene): each seat chip is nearer its own occupant (or own chair) than any other person
// or chair of that scene, empty or taken
const NEAREST_IS_OWNER = `(() => { ${K} ${BOX}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-lab\\d+$/.test(e.getAttribute('data-node')) && visible(e));
  if (!labs.length) return false;
  const ctr = e => { const r = e.getBoundingClientRect(); return {x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2, e}; };
  const dist = (b, q) => Math.hypot(Math.max(0, b.l - q.x, q.x - b.r), Math.max(0, b.t - q.y, q.y - b.b));
  return labs.every(lab => {
    const sc = lab.getAttribute('data-node')[0];
    const chairs = [...svg.querySelectorAll('[data-node^="' + sc + 'rm-chair-"]')].map(ctr);
    const people = [...svg.querySelectorAll('[data-node]')].filter(e => new RegExp('^' + sc + '-p\\\\d+$').test(e.getAttribute('data-node'))).map(ctr);
    const body = bx(svg.querySelector('[data-node="' + lab.getAttribute('data-node') + '-body"]'));
    const owner = svg.querySelector('[data-node="' + lab.getAttribute('data-owner') + '"]');
    const seat = svg.querySelector('[data-node="' + lab.getAttribute('data-seat') + '"]');
    const own = [owner, seat].filter(Boolean).map(ctr);
    const d0 = Math.min(...own.map(q => dist(body, q)));
    const others = [...chairs, ...people].filter(q => q.e !== owner && q.e !== seat && own.every(o => Math.hypot(o.x - q.x, o.y - q.y) > 4 * K));
    return others.every(q => dist(body, q) > d0);
  });
})()`;
// labels hidden: the two rooms (with their outside strips) cover a fair share of the caption-safe box
const ROOMS_GROW = "(() => { const m = svg.getScreenCTM().inverse(); const vb = svg.viewBox.baseVal; const area = n => { const b = svg.querySelector('[data-node=\"' + n + '\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); return (p2.x - p1.x) * (p2.y - p1.y); }; return (area('A-scene') + area('B-scene')) / (vb.width * 0.88 * vb.height * 0.74) >= 0.43; })()";
const PEOPLE_SIZE = `(() => { ${K}
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-p\\d+$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); return hd.width / K >= 26 && e.getBoundingClientRect().width / K >= 60; });
})()`;
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
// equal visual weight: both plans (room, furniture, people) are drawn at the same size
const EQUAL = "(() => { const a = svg.querySelector('[data-node=\"A-plan\"]').getBoundingClientRect(), b = svg.querySelector('[data-node=\"B-plan\"]').getBoundingClientRect(); return Math.abs(a.width - b.width) < 2 && Math.abs(a.height - b.height) < 2; })()";

ratioChecks(ID, 'cards off faces, labels own seats, clean guide, large people, equal scenes', [
  {at: times(0, 1, 0.05), dom: NO_CARD_ON_FACE, label: 'rendered: no label, caption, header, strip or guide covers a head'},
  {at: [0.85, 1], tv: ['all'], dom: LABEL_OWNS_SEAT, label: 'rendered: each seat label within 40 px of its own person; its leader ends on that person and crosses no text or head'},
  {at: [1], tv: ['all'], dom: GUIDE_CLEAN, label: 'rendered: the guide leaders cross no text and no head'},
  {at: [0, 1], dom: PEOPLE_SIZE, label: 'rendered: people >= 60 px across, heads >= 26 px (1080p)'},
  {at: [0.85, 1], tv: ['all'], dom: NEAREST_IS_OWNER, label: 'rendered: each seat chip is nearer its own occupant than any other person or chair (empty or taken) in its scene'},
  {at: [1], tv: ['none'], dom: ROOMS_GROW, label: 'rendered: labels hidden — the two rooms take the freed space (>= 43 % of the caption-safe box together)'},
  {at: [1], dom: FILL, label: 'rendered: the two scenes and the strip fill the caption-safe box'},
  {at: [0, 1], dom: EQUAL, label: 'rendered: both plans drawn at the same size (equal weight)'},
  {at: [1], fn: "s.arrangement === 'row' ? s.panelShare >= 0.4 : s.arrangement === 'center' ? s.panelShare >= 0.3 : s.panelShare >= 0.99", label: 'each scene >= 40 % of the width side by side over the strip, >= 30 % (full height) beside the centre column, full width when stacked'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);
