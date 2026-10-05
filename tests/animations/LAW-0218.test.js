// LAW-0218 — Acceso a sala · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends on its part (connectorGaps = 0), the visit order does not change
// when seeking (determinism + the tracer's visits are always a prefix of the supplied traversal), and a relation is
// not drawn as causation by default (plain relations = solid line with end dots, never an arrow).
// Timing (u): parts separate 0.03–0.15 (captions 0.10–0.17); relations draw one by one inside 0.20–0.42; the tracer
// runs 0.45–0.73 while the focus part enlarges; the first participant of each route walks inside 0.46–0.72 and its
// label arrives on landing; the connector legend fades in 0.76–0.81; everything is still from 0.81.
// Coordinator decision (standing stress rule, 2026-09-26, AUTHORING item 20): the long-labels-stress texts are capped
// (strictly longer than baseline, counts equal to baseline) — measurements in the presets file.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0218';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const PEOPLE = Array.from({length: 6}, (_, i) => `p${i}`);
const PREFIX = "(() => { const order = P.traversalOrder; return s.visited.every((v, i) => v === order[i]); })()";

contractSuite(ID, {
  continuity: PEOPLE,
  attach: [0, 1, 2, 3].map(i => ({from: 0.75, to: 1, a: `p${i}`, b: `seat${i}`, tol: 0.5})),
  semantic: [
    {at: 0.02, fn: 's.explode === 0 && s.connectorsDrawn.every(d => d === 0)', label: 'start: the joined plan, no connector'},
    {at: 0.16, fn: 's.explode === 1 && s.connectorsDrawn.every(d => d === 0)', label: 'separate: the parts have come apart before any relation is drawn'},
    {at: 0.3, fn: 's.connectorsDrawn.some(d => d > 0) && s.connectorsDrawn.some(d => d === 0)', label: 'relate: the relations draw one by one'},
    {at: 0.43, fn: 's.connectorsDrawn.every(d => d === 1) && s.tracerOn === 0', label: 'every supplied relation drawn before the tracer starts'},
    {at: 0.44, fn: "s.states.every(x => x === 'waiting' || x === 'seated')", label: 'nobody walks before the trace beat'},
    {at: 0.6, fn: "s.tracerOn === 1 && s.visited.length >= 1 && s.states.some(x => x === 'walking' || x === 'sitting' || x === 'seated')", label: 'trace: the tracer runs while the tracked participants walk'},
    ...[0.47, 0.52, 0.58, 0.64, 0.7].map(at => ({at, fn: PREFIX.replace('P.traversalOrder', "['lobby', 'publicRoute', 'room', 'restrictedRoute', 'lobby']"), label: `the tracer's visits are a prefix of the supplied order (u=${at})`})),
    {at: 0.75, fn: "s.states.every(x => x === 'seated')", label: 'the main action is complete by u 0.75'},
    {at: 1, fn: "s.connectorGaps.every(g => g <= 1) && s.arrows === 0 && s.connectorKinds.every(k => k === 'relation')", label: 'every connector ends on its part; plain relations have no arrow'},
    {at: 1, fn: "s.labels.every(l => l === 1) && s.legendShown === 1 && s.problems.length === 0 && s.allReached", label: 'gather: every label, the connector legend; the composition fits'},
    {at: 1, params: {relationships: [{from: 'lobby', to: 'publicRoute', kind: 'sequence', label: 'Then (as configured)'}]}, fn: "s.arrows === 1 && s.connectorKinds[0] === 'sequence'", label: 'a supplied sequence is drawn with its arrow (only when supplied)'},
    {at: 0.3, params: {textVisibility: 'none'}, fn: 's.explode === 1 && s.connectorsDrawn.some(d => d > 0)', label: 'labels hidden: the same decomposition and relations'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.connectorsDrawn.length === 3 && s.focus === 'restrictedRoute'", label: 'alternative: three supplied relations, the restricted route in focus'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const seats = p.routes.map(r => p.seats[r.seat] && p.seats[r.seat].label).filter(Boolean); const kinds = [...new Set(p.relationships.map(r => r.kind))]; return [p.courts.building, p.courts.room, ...seats, p.labels.publicAccess, p.labels.restrictedAccess, p.labels.key, ...p.elements.map(e => e.label), ...p.relationships.map(r => r.label || p.relationLabels[r.kind]), ...kinds.map(k => p.relationLabels[k])];",
  content: "const seats = p.routes.map(r => p.seats[r.seat] && p.seats[r.seat].label).filter(Boolean); return [p.courts.building, p.courts.room, ...seats, ...p.elements.map(e => e.label), ...p.relationships.map(r => r.label || p.relationLabels[r.kind]), p.labels.publicAccess, p.labels.restrictedAccess];",
  captions: "const kinds = [...new Set(p.relationships.map(r => r.kind))]; return kinds.map(k => p.relationLabels[k]);",
});

const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const HEADS = "const heads = [...svg.querySelectorAll('[data-node$=\"-head\"]')].filter(e => /^p\\d+-head$/.test(e.getAttribute('data-node'))).map(bx);";
// no chip (part captions, relation labels, seat labels, panel) covers a head
const NO_CARD_ON_FACE = `(() => { ${K} ${BOX} ${HEADS}
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^(lab\\d+-body|el-\\w+|rel\\d+-lab|bld-name|room-name|legend-\\w+|kind-\\w+|key)$/.test(e.getAttribute('data-node')) && visible(e)).map(bx);
  return heads.length > 0 && cards.every(c => heads.every(h => !hit(c, h, 1)));
})()`;
// Item 5: every connector shows >= 3 line heights of line outside its own label chip
const LINK_VISIBLE = `(() => {
  for (const path of svg.querySelectorAll('[data-node^="rel"][data-node$="-line"]')) {
    if (!visible(path)) continue;
    const i = path.getAttribute('data-node').match(/\\d+/)[0];
    const lab = svg.querySelector('[data-node="rel' + i + '-lab"]');
    const lb = lab && visible(lab) ? lab.getBoundingClientRect() : null;
    const t = lab && lab.querySelector('text');
    const lh = t ? parseFloat(getComputedStyle(t).fontSize) * t.getScreenCTM().a * 1.2 : 0;
    const m = path.getScreenCTM(), L = path.getTotalLength();
    let vis = 0, prev = null;
    for (let j = 0; j <= 200; j++) {
      const q = path.getPointAtLength(L * j / 200).matrixTransform(m);
      if (prev && !(lb && q.x > lb.left && q.x < lb.right && q.y > lb.top && q.y < lb.bottom)) vis += Math.hypot(q.x - prev.x, q.y - prev.y);
      prev = q;
    }
    if (lh && vis < 3 * lh) return false;
  }
  return true;
})()`;
// each relation label is nearest its own connector (<= 40 px) and clearly further from any other connector
const OWN_NEAREST = `(() => { ${K}
  const lines = [...svg.querySelectorAll('[data-node^="rel"][data-node$="-line"]')];
  const pts = lines.map(pth => { const m = pth.getScreenCTM(), L = pth.getTotalLength(); return Array.from({length: 41}, (_, j) => pth.getPointAtLength(L * j / 40).matrixTransform(m)); });
  const dist = (b, P) => Math.min(...P.map(q => Math.hypot(Math.max(0, b.left - q.x, q.x - b.right), Math.max(0, b.top - q.y, q.y - b.bottom))));
  for (const lab of svg.querySelectorAll('[data-node]')) {
    const nm = lab.getAttribute('data-node');
    if (!/^rel\\d+-lab$/.test(nm) || !visible(lab)) continue;
    const i = +nm.match(/\\d+/)[0];
    const b = lab.getBoundingClientRect();
    const own = dist(b, pts[i]);
    if (own / K > 40) return false;
    if (pts.some((P, j) => j !== i && dist(b, P) < own + 8 * K)) return false;
  }
  return true;
})()`;
const PEOPLE_SIZE = `(() => { ${K}
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); const b = e.getBoundingClientRect(); return hd.width / K >= 26 && Math.max(b.width, b.height) / K >= 60; });
})()`;
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
const IN_FRAME = "(() => { const vb = svg.viewBox.baseVal; const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); return p1.x >= -1 && p1.y >= -1 && p2.x <= vb.width + 1 && p2.y <= vb.height + 1; })()";
const EQUAL_ROUTES = `(() => {
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  const a = q('rm-badge-public').getBoundingClientRect(), b = q('rm-badge-restricted').getBoundingClientRect();
  if (Math.abs(a.width - b.width) > 0.5 || Math.abs(a.height - b.height) > 0.5) return false;
  for (const n of ['rm-door-public', 'rm-door-restricted', 'rm-badge-public', 'rm-badge-restricted']) if ([...q(n).querySelectorAll('*')].some(e => e.getAttribute('stroke-dasharray'))) return false;
  const lines = [...svg.querySelectorAll('[data-node]')].filter(e => /^trail\\d+-line$/.test(e.getAttribute('data-node')));
  if (new Set(lines.map(e => e.getAttribute('stroke-width'))).size > 1) return false;
  for (const e of lines) { const L = e.getTotalLength(); const d = (e.getAttribute('stroke-dasharray') || '').split(/[ ,]+/).map(Number); if (d.length && d[0] > 0 && d[0] < L - 1) return false; }
  return true;
})()`;
// shipped presets: no arrowhead anywhere (every shipped relation is a plain relation)
const NO_ARROWS = "![...svg.querySelectorAll('[data-node]')].some(e => /^rel\\d+-head$/.test(e.getAttribute('data-node')) && visible(e) && e.getAttribute('opacity') !== '0') && !svg.querySelector('[marker-end], marker')";

// relation labels never stack: every pair of relation chips keeps >= 16 px apart (1080p)
const LABELS_APART = `(() => { ${K}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^rel\\d+-lab$/.test(e.getAttribute('data-node')) && visible(e)).map(e => e.getBoundingClientRect());
  for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++) { const a = labs[i], b = labs[j]; const gx = Math.max(a.left - b.right, b.left - a.right), gy = Math.max(a.top - b.bottom, b.top - a.bottom); if (Math.max(gx, gy) / K < 16) return false; }
  return true;
})()`;

ratioChecks(ID, 'labels own their connectors, cards off faces, people size, equal routes, fill', [
  {at: [0.45, 0.75, 1], tv: ['all'], dom: LINK_VISIBLE, label: 'rendered: every connector shows >= 3 line heights of line outside its chip'},
  {at: [0.45, 1], tv: ['all'], dom: OWN_NEAREST, label: "rendered: each relation label's nearest connector is its own (<= 40 px, others >= 8 px further)"},
  {at: [0.45, 1], tv: ['all'], dom: LABELS_APART, label: 'rendered: relation labels never stack (>= 16 px apart)'},
  {at: times(0, 1, 0.05), dom: NO_CARD_ON_FACE, label: 'rendered: no caption, label or panel text covers a head'},
  {at: [0, 0.2, 0.5, 0.8, 1], dom: PEOPLE_SIZE, label: 'rendered: people >= 60 px across (shoulder span, any facing), heads >= 26 px (1080p)'},
  {at: [1], dom: FILL, label: 'rendered: the mechanism fills the caption-safe box'},
  {at: [0, 1, ...times(0.44, 0.74, 0.01)], dom: IN_FRAME, label: 'rendered: nothing leaves the frame (the exploded parts and the enlarged focus with its caption included), dense over the trace'},
  {at: [0.5, 1], dom: EQUAL_ROUTES, label: 'rendered: both routes have equal weight (badges, doors, solid lines; nothing dashed)'},
  {at: [0.5, 1], dom: NO_ARROWS, label: 'rendered: no arrowhead (shipped relations are plain relations)'},
  {at: [0.3, 0.6, 1], fn: 's.connectorGaps.every(g => g <= 1)', label: 'every connector ends on its part'},
  {at: times(0.44, 0.74, 0.03), fn: "s.visited.every((v, i) => v === P.traversalOrder[i])", label: 'the tracer visit order is a prefix of the supplied traversal'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
  {at: [1], tv: ['all'], presets: ['baseline-illustrative', 'baseline-es'], fn: 's.textPx >= 19.5', label: 'baseline and baseline-es: text >= 19.5 px in every ratio'},
  {at: [0.5, 0.6, 0.7], fn: "s.labels.every((l, i) => l === 0 || s.states[i] === 'seated')", label: 'a tracked label never arrives before its occupant lands'},
]);

// The focus part really enlarges (>= 1.2x, measured on the RENDERED part) while the tracer is on it, and its caption
// follows (the caption box grows by the same factor).
test(`${ID}: the focus part enlarges >= 1.2x on screen and its caption follows (every preset × ratio)`, async ({page}) => {
  test.setTimeout(180000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, ps]) => {
    const def = await window.__lib.load(id);
    const out = [];
    const part = {lobby: 'rm-g-lobby', publicRoute: 'rm-g-pc', restrictedRoute: 'rm-g-rc', room: 'rm-g-room', building: 'bld-wrap'};
    for (const pr of ps) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      const svg = x.element;
      const focus = x.getState({bounds: false}).params.focusElement;
      const q = n => svg.querySelector(`[data-node="${n}"]`);
      x.seek(0.44 * x.durationMs);
      const w0 = q(part[focus]).getBoundingClientRect().width;
      const capName = focus === 'building' ? 'el-building' : `el-${focus}`;
      const c0 = q(capName) ? q(capName).getBoundingClientRect().width : 0;
      let best = 0, cap = 0;
      for (let u = 0.44; u <= 0.74; u += 0.005) {
        x.seek(u * x.durationMs);
        const r = q(part[focus]).getBoundingClientRect().width / w0;
        if (r > best) { best = r; cap = q(capName) ? q(capName).getBoundingClientRect().width / c0 : 0; }
      }
      if (best < 1.2 - 1e-3) out.push(`${pr.name} ${ratio}: focus ${focus} peaks at ${best.toFixed(3)}x`);
      if (Math.abs(cap - best) > 0.02) out.push(`${pr.name} ${ratio}: caption scale ${cap.toFixed(3)} vs part ${best.toFixed(3)}`);
      x.destroy(); el.remove();
    }
    return out;
  }, [ID, presets]);
  expect(bad, bad.join('\n')).toEqual([]);
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
// institutions: every shipped relationship is a plain relation (no arrow, no sequence/causal route).
test(`${ID}: no shipped preset or default supplies a directed link between institutions`, async () => {
  const def = (await import('../../src/animations/courts/LAW-0218.js')).default;
  const bad = [];
  for (const pr of [{name: 'default', params: {}}, ...presetsFor(ID)]) {
    (pr.params.relationships ?? def.defaultParams.relationships).forEach((r, i) => { if (r.kind !== 'relation') bad.push(`${pr.name} relationships[${i}] ${r.kind}`); });
  }
  expect(bad).toEqual([]);
});
