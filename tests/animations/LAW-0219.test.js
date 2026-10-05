// LAW-0219 — Acceso a sala · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact is modified (only the supplied route of the
// focus participant — and with it the corridor, the door and the path to the SAME seat), and no legal consequence is
// invented (no winner, score, tick, cross or rule; the neutral note says both are as supplied).
// Timing (u): identical base until 0.17; the focus participant turns 0.19–0.24, its route draws 0.22–0.33, the route
// badge 0.30–0.34, both headers 0.34–0.39; everyone walks in parallel inside 0.41–0.755 with the SAME windows in A and
// B, each seat label arriving body-first as its occupant lands; guide 0.78–0.83; neutral note 0.82–0.86.
// Coordinator decision (standing stress rule, 2026-09-26, AUTHORING item 20): the long-labels-stress texts are capped
// (every field strictly longer than baseline, same count as baseline) because near-maximum texts leave the paired
// plans at k 0.55 (people ~55 px) with two unplaceable seat labels at 1:1 — measurements in the presets file.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0219';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const PEOPLE = ['A', 'B'].flatMap(k => [0, 1, 2, 3, 4, 5].map(i => `${k}p${i}`));

contractSuite(ID, {
  continuity: PEOPLE,
  attach: ['A', 'B'].flatMap(k => [0, 1, 2, 3].map(i => ({from: 0.76, to: 1, a: `${k}p${i}`, b: `${k}seat${i}`, tol: 0.5}))),
  semantic: [
    {at: 0.1, fn: "s.scenes === 2 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.lookA.header === 0 && s.A.states.every(x => x === 'waiting')", label: 'base: two identical complete scenes, nobody moved, no scenario header yet'},
    {at: 0.3, fn: "JSON.stringify(s.lookA.trails) !== JSON.stringify(s.lookB.trails) || s.lookA.trails[s.focus] > 0", label: 'the change: the focus route draws (a different corridor and door in A and B)'},
    {at: 0.3, fn: "s.A.states.every(x => x === 'waiting') && s.B.states.every(x => x === 'waiting')", label: 'during the change nobody walks yet (cause before effect)'},
    {at: 0.4, fn: "s.lookA.header === 1 && s.lookB.header === 1 && s.lookA.tag === 1 && s.lookB.tag === 1", label: 'both scenario headers and route badges appear together'},
    {at: 0.55, fn: "JSON.stringify(s.A.states) === JSON.stringify(s.B.states)", label: 'parallel: every person is at the same stage of their walk in A and B'},
    {at: 0.55, fn: "s.A.people.every((q, i) => i === s.focus || (q.x === s.B.people[i].x && q.y === s.B.people[i].y))", label: 'parallel: everyone except the focus participant is at the same place in A and B'},
    {at: 0.77, fn: "s.A.states.every(x => x === 'seated') && s.B.states.every(x => x === 'seated')", label: 'the main action is complete by u 0.77'},
    {at: 1, fn: "s.A.labels.every(l => l === 1) && s.B.labels.every(l => l === 1)", label: 'both: every seat label shown'},
    {at: 1, fn: "s.focusDoorA === 'public' && s.focusDoorB === 'restricted' && s.focusThroughOwnDoor && s.focusSameSeat && s.othersIdentical && s.sameWindows", label: 'exactly one fact differs: the focus route (its corridor and door), to the same seat, with the same timing'},
    {at: 1, fn: 's.guideShown === 1 && s.noteShown === 1 && s.allReached && s.problems.length === 0', label: 'guide joins the changed route; neutral note shown'},
    {at: 1, params: {scenarioB: {label: 'B', caption: 'x', access: 'public'}}, fn: "JSON.stringify(s.lookA.people) === JSON.stringify(s.lookB.people) && JSON.stringify(s.lookA.trails) === JSON.stringify(s.lookB.trails)", label: 'identical supplied routes give identical scenes (nothing invented)'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.focusDoorA !== s.focusDoorB && s.A.states.every(x => x === 'seated')", label: 'labels hidden: the difference still reads (different door and corridor)'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.accessA === 'restricted' && s.accessB === 'public' && s.focus === 0 && s.A.states.length === 3", label: 'alternative: swapped scenarios, a different focus participant, three people'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: "const seats = p.routes.map(r => p.seats[r.seat] && p.seats[r.seat].label).filter(Boolean); return [p.courts.building, p.courts.room, ...seats, p.labels.publicAccess, p.labels.restrictedAccess, p.labels.key, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];",
  content: "const seats = p.routes.map(r => p.seats[r.seat] && p.seats[r.seat].label).filter(Boolean); return [p.courts.building, p.courts.room, ...seats, p.scenarioA.label, p.scenarioB.label, p.changedFact, ...p.sharedFacts, p.labels.publicAccess, p.labels.restrictedAccess];",
  captions: "return [p.scenarioA.caption, p.scenarioB.caption, p.comparisonLabels.guide, p.comparisonLabels.neutral];",
});

const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const HEADS = "const heads = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-p\\d+-head$/.test(e.getAttribute('data-node'))).map(bx);";
const NO_CARD_ON_FACE = `(() => { ${K} ${BOX} ${HEADS}
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^([AB]-lab\\d+-body|hdr\\d|guide-card|changed-fact|shared\\d|legend-\\w+|key|neutral|bld-name|room-name)$/.test(e.getAttribute('data-node')) && visible(e)).map(bx);
  return heads.length > 0 && cards.every(c => heads.every(h => !hit(c, h, 1)));
})()`;
// each seat label: within 40 px of its own person, its leader ends on that person and crosses no text or head
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
// owner proximity (per scene): each chip is nearer its own occupant (or own chair) than any other person or drawn chair
const NEAREST_IS_OWNER = `(() => { ${K} ${BOX}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-lab\\d+$/.test(e.getAttribute('data-node')) && visible(e));
  if (!labs.length) return false;
  const ctr = e => { const r = e.getBoundingClientRect(); return {x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2, e}; };
  const dist = (b, q) => Math.hypot(Math.max(0, b.l - q.x, q.x - b.r), Math.max(0, b.t - q.y, q.y - b.b));
  return labs.every(lab => {
    const sc = lab.getAttribute('data-node')[0];
    const chairs = [...svg.querySelectorAll('[data-node^="' + sc + '-rm-chair-"]')].map(ctr);
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
// the guide leaders cross no text and no head
const GUIDE_CLEAN = `(() => { ${K} ${BOX} ${HEADS}
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-node="guide-card"]') && !t.closest('[data-layer="content-notice"]')).map(bx);
  const paths = [...svg.querySelectorAll('[data-node^="guide-lead"]')];
  if (!paths.length) return false;
  for (const path of paths) {
    const m = path.getScreenCTM(), L = path.getTotalLength();
    for (let j = 3; j <= 57; j++) { const q = path.getPointAtLength((L * j) / 60).matrixTransform(m); if ([...texts, ...heads].some(o => q.x > o.l - 2 && q.x < o.r + 2 && q.y > o.t - 2 && q.y < o.b + 2)) return false; }
  }
  return true;
})()`;
const PEOPLE_SIZE = `(() => { ${K}
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-p\\d+$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); const b = e.getBoundingClientRect(); return hd.width / K >= 26 && Math.max(b.width, b.height) / K >= 60; });
})()`;
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
const IN_FRAME = "(() => { const vb = svg.viewBox.baseVal; const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); return p1.x >= -1 && p1.y >= -1 && p2.x <= vb.width + 1 && p2.y <= vb.height + 1; })()";
// equal visual weight: both plans (room, furniture, people) are drawn at the same size
const EQUAL = "(() => { const a = svg.querySelector('[data-node=\"A-plan\"]').getBoundingClientRect(), b = svg.querySelector('[data-node=\"B-plan\"]').getBoundingClientRect(); return Math.abs(a.width - b.width) < 2 && Math.abs(a.height - b.height) < 2; })()";
// equal weight of the two ROUTES in each plan: same badge size, same line width, no dashes on doors, badges or lines
const EQUAL_ROUTES = `(() => {
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  for (const sc of ['A', 'B']) {
    const a = q(sc + '-rm-badge-public').getBoundingClientRect(), b = q(sc + '-rm-badge-restricted').getBoundingClientRect();
    if (Math.abs(a.width - b.width) > 0.5 || Math.abs(a.height - b.height) > 0.5) return false;
    for (const n of [sc + '-rm-door-public', sc + '-rm-door-restricted', sc + '-rm-badge-public', sc + '-rm-badge-restricted']) if ([...q(n).querySelectorAll('*')].some(e => e.getAttribute('stroke-dasharray'))) return false;
  }
  const lines = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-trail\\d+-line$/.test(e.getAttribute('data-node')));
  if (new Set(lines.map(e => e.getAttribute('stroke-width'))).size > 1) return false;
  for (const e of lines) { const L = e.getTotalLength(); const d = (e.getAttribute('stroke-dasharray') || '').split(/[ ,]+/).map(Number); if (d.length && d[0] > 0 && d[0] < L - 1) return false; }
  return true;
})()`;
const NO_ARROWS = "![...svg.querySelectorAll('[data-node]')].some(e => /-head$/.test(e.getAttribute('data-node')) && !/^[AB]-p\\d+-head$/.test(e.getAttribute('data-node')) && visible(e)) && !svg.querySelector('[marker-end], marker')";

// nobody walks through anybody: in each scene every two head centres stay >= one head diameter apart at every u
const HEADS_APART = `(() => {
  for (const sc of ['A', 'B']) {
    const hs = [...svg.querySelectorAll('[data-node]')].filter(e => new RegExp('^' + sc + '-p\\\\d+-head$').test(e.getAttribute('data-node'))).map(e => e.getBoundingClientRect());
    for (let i = 0; i < hs.length; i++) for (let j = i + 1; j < hs.length; j++) {
      const a = hs[i], b = hs[j];
      const d = Math.hypot((a.left + a.right) / 2 - (b.left + b.right) / 2, (a.top + a.bottom) / 2 - (b.top + b.bottom) / 2);
      if (d < Math.max(a.width, b.width)) return false;
    }
  }
  return true;
})()`;


// AUTHORING: baseline presets (baseline-es included) render every visible text >= 19.5 px (1080p) in every ratio
const TEXT_195 = `(() => { const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
  const s0 = svg.getScreenCTM().a; const vb = svg.viewBox.baseVal;
  const ts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]') && eff(t) >= 0.05 && (t.textContent || '').trim() && t.getBoundingClientRect().width >= 0.5);
  return ts.length > 0 && ts.every(t => parseFloat(getComputedStyle(t).fontSize) * (t.getScreenCTM().a / s0) * 1080 / Math.min(vb.width, vb.height) >= 19.5 - 0.05);
})()`;


// review 1 (LAW-0219): each scene's drawn plan measured on the rendered DOM against the FRAME width (viewBox)
const SCENE_SHARE = `(() => { const m = svg.getScreenCTM(); const vb = svg.viewBox.baseVal;
  const r = k => svg.querySelector('[data-node="' + k + '-rm-plan-art"]').getBoundingClientRect();
  const a = r('A'), b = r('B'); const stacked = a.bottom <= b.top + 1 || b.bottom <= a.top + 1;
  return [a, b].every(q => q.width / m.a / vb.width >= (stacked ? 0.71 : 0.4));
})()`;


// review 1 (courts-05): no seat chip lies over any route line of its scene (its own included)
const CHIPS_OFF_ROUTES = `(() => {
  for (const sc of ['A', 'B']) {
    const labs = [...svg.querySelectorAll('[data-node]')].filter(e => new RegExp('^' + sc + '-lab\\\\d+-body$').test(e.getAttribute('data-node')) && visible(e)).map(e => e.getBoundingClientRect());
    const lines = [...svg.querySelectorAll('[data-node]')].filter(e => new RegExp('^' + sc + '-trail\\\\d+-line$').test(e.getAttribute('data-node')) && visible(e));
    if (!labs.length || !lines.length) return false;
    for (const r of labs) for (const ln of lines) {
      const m = ln.getScreenCTM(), L = ln.getTotalLength();
      for (let j = 0; j <= 200; j++) { const q = ln.getPointAtLength(L * j / 200).matrixTransform(m); if (q.x > r.left && q.x < r.right && q.y > r.top && q.y < r.bottom) return false; }
    }
  }
  return true;
})()`;


// review 1 (courts-05): seat chips stay off every mark: route badges, the hall-corner tag and the corner plants
const CHIPS_OFF_MARKS = `(() => {
  const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
  const bx = e => e.getBoundingClientRect();
  const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-lab\\d+-body$/.test(e.getAttribute('data-node')) && eff(e) > 0.05).map(bx);
  const marks = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-(rm-plant\\d+|rm-badge-\\w+|tag)$/.test(e.getAttribute('data-node')) && eff(e) > 0.05 && bx(e).width > 0.5).map(bx);
  return labs.length > 0 && labs.every(l => marks.every(m => !hit(l, m)));
})()`;

ratioChecks(ID, 'cards off faces, labels own seats, clean guide, large people, equal scenes and routes', [
  {at: times(0, 1, 0.05), dom: NO_CARD_ON_FACE, label: 'rendered: no label, header, strip text or guide card covers a head'},
  {at: [0.8, 1], tv: ['all'], dom: LABEL_OWNS_SEAT, label: 'rendered: each seat label within 40 px of its own person; its leader ends on that person and crosses no text or head'},
  {at: [0.8, 1], tv: ['all'], dom: NEAREST_IS_OWNER, label: 'rendered: each seat chip is nearer its own occupant than any other person or drawn chair in its scene'},
  {at: [1], tv: ['all'], dom: GUIDE_CLEAN, label: 'rendered: the guide leaders cross no text and no head'},
  {at: [0, 0.2, 0.5, 0.8, 1], dom: PEOPLE_SIZE, label: 'rendered: people >= 60 px across (shoulder span, any facing), heads >= 26 px (1080p)'},
  {at: times(0, 1, 0.005), dom: HEADS_APART, label: 'rendered: every two head centres stay >= one head diameter apart at every u (nobody walks through anybody)'},
  {at: [1], dom: FILL, label: 'rendered: the two scenes and the shared texts fill the caption-safe box'},
  {at: [0, 0.5, 1], dom: IN_FRAME, label: 'rendered: nothing leaves the frame'},
  {at: [0, 1], dom: EQUAL, label: 'rendered: both plans drawn at the same size (equal weight)'},
  {at: [0.5, 1], dom: EQUAL_ROUTES, label: 'rendered: both routes have equal weight in both plans (nothing dashed)'},
  {at: [0, 0.5, 1], dom: NO_ARROWS, label: 'rendered: no directed link or arrowhead anywhere'},
  {at: [0.9, 1], tv: ['all'], dom: CHIPS_OFF_ROUTES, label: 'rendered: no seat chip lies over any route line (its own included), in either scene'},
  {at: [0.9, 1], tv: ['all'], dom: CHIPS_OFF_MARKS, label: 'rendered: no seat chip lies over a route badge, the hall tag or a plant'},
  {at: [0.1, 0.5, 1], dom: SCENE_SHARE, label: 'rendered: each drawn scene >= 40 % of the FRAME width side by side, >= 71 % stacked'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
  {at: [0.1, 0.5, 1], tv: ['all'], presets: ['baseline-illustrative', 'baseline-es'], dom: TEXT_195, label: 'rendered: baseline and baseline-es: every visible text >= 19.5 px in every ratio'},
  {at: [0.6, 0.7], fn: "['A', 'B'].every(k => s[k].labels.every((l, i) => l === 0 || s[k].states[i] === 'seated'))", label: 'labels never arrive before their occupant lands'},
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

// Coordinator decision (courts-02 review 1): no shipped preset or default supplies a directed link between
// institutions. This scene has no link field; the only supplied "route" data name an access route per participant.
test(`${ID}: no shipped preset or default supplies a directed link between institutions`, async () => {
  const def = (await import('../../src/animations/courts/LAW-0219.js')).default;
  const bad = [];
  const walk = (o, path) => {
    if (Array.isArray(o)) o.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (k === 'kind' && v !== 'relation') bad.push(`${path}.kind=${v}`); walk(v, `${path}.${k}`); }
  };
  for (const pr of [{name: 'default', params: def.defaultParams}, ...presetsFor(ID)]) {
    walk(pr.params, pr.name);
    (pr.params.routes ?? def.defaultParams.routes).forEach((r, i) => { if (Object.keys(r).some(k => !['seat', 'access'].includes(k))) bad.push(`${pr.name} routes[${i}] has extra keys`); });
  }
  expect(Object.keys(def.paramsSchema.properties)).not.toContain('relationships');
  expect(bad).toEqual([]);
});
