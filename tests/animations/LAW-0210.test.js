// LAW-0210 — Asignación de órgano · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends on its part (anchored to the part edges), the order does not change
// when seeking (the tracer's visit order depends only on u), and a relation is not drawn as causation by default
// (plain relations have no arrowhead). Legal content (coordinator rule 2026-09-26): no shipped preset draws a
// directed link — and none between venues or institutions; the route is decided only by the supplied mapping row
// whose datum equals the file datum (or the file waits in the slot when none does).
// Timing (u): separate 0.02–0.15 · relationships drawn one by one 0.20–0.42 · tracer 0.45–0.72 (the matched row,
// the switch pointer and the file in the tray follow the tracer's visits) · legend and key 0.75–0.81.
// coordinator decision 2026-09-26 (standing rule, AUTHORING item 20): the long-labels-stress field lengths are capped
// to the longest tried values that fit every ratio at >= 16 px (1:1 did not fit at near-maximum after six row templates,
// a two-column mapping sheet and wider gaps); every field stays strictly longer than baseline, 5 relationships (= baseline).
// Rendered: no connector runs through any text (titles included); the venues→desk link leaves the matched venue;
// both clerks (sorting clerk, receiving clerk) >= 60 px across.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0210';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0.01, fn: "s.slide === 0 && s.relationsDrawn.every(v => v === 0) && s.separateStart > 0", label: 'separate: the parts start gathered, nothing is related yet'},
    {at: 0.19, fn: "s.slide === 1 && s.relationsDrawn.every(v => v === 0)", label: 'the parts have separated before any relation is drawn'},
    {at: 0.3, fn: "s.relationsDrawn.some(v => v > 0) && s.relationsDrawn.some(v => v === 0)", label: 'relate: the relationships are drawn one by one'},
    {at: 0.43, fn: "s.relationsDrawn.every(v => v === 1) && !s.tracerVisible && s.rowMatched === 0", label: 'all relationships drawn before the tracer starts'},
    {at: 0.44, fn: "s.arrows.every(a => a.kind !== 'relation' || !a.arrow)", label: 'a plain relation never has an arrowhead'},
    {at: 0.6, fn: "s.tracerVisible && JSON.stringify(s.visitOrder) === JSON.stringify(['origin', 'file', 'switch', 'mapping'].slice(0, s.visitOrder.length))", label: 'trace: the tracer visits the parts in the supplied order'},
    {at: 0.76, fn: "s.rowMatched === 1 && s.matchRow === 1 && s.pointerTo === 'venue1' && s.fileSetDown === 'tray' && !s.tracerVisible", label: 'the row equal to the file datum (Venue East) is outlined, the switch turns to its branch, the file lies in the tray'},
    {at: 1, fn: "s.problems.length === 0 && s.connectorGaps.every(gp => gp <= 2) && s.labelsClear && s.allReached", label: 'hold: every connector ends on its part; labels clear; composition fits'},
    {at: 0.5, fn: "s.rowMatched === 0 && s.pointerTo === 'none'", label: 'seeking back: nothing matched before the tracer reaches the mapping sheet'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.selected === -1 && s.pointerTo === 'slot' && s.fileSetDown === 'slot' && s.rowMatched === 1", label: 'no matching row: the switch turns to the waiting slot and the file waits there; no venue is marked (nothing inferred)'},
    {at: 1, params: {routes: [{datum: 'district = East (fictional)', venue: 2}]}, fn: "s.selected === 2 && s.pointerTo === 'venue2'", label: 'the route follows ONLY the supplied mapping (not the venue names)'},
    {at: 0.7, params: {textVisibility: 'none'}, fn: "s.pointerTo === 'venue1'", label: 'labels hidden: the same mechanism reads'},
  ],
});

// Coordinator rule (2026-09-26): shipped presets draw no directed links; never a directed link between venues or
// institutions (a user-configured sequence link would carry its "as configured (illustrative)" caption).
test(`${ID}: no shipped preset contains a directed link (between venues, institutions or any parts)`, async () => {
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const {default: def} = await import('../../src/animations/courts/LAW-0210.js');
  for (const pr of presets) {
    const rels = pr.params.relationships || def.defaultParams.relationships;
    for (const q of rels) expect(q.kind, `${pr.name}: ${q.from}→${q.to}`).toBe('relation');
  }
});

suppliedTextSuite(ID, {
  fields: "return [p.courts.origin, ...p.courts.venues.map(v => v.name), ...p.routes.filter(r => r.venue < p.courts.venues.length).map(r => r.datum), p.file.label, p.file.datum, p.seats.arrival, p.seats.waiting, p.labels.junction, p.labels.key, ...p.elements.map(e => e.label), ...p.relationships.filter(r => r.from !== r.to).map(r => r.label || p.relationLabels[r.kind]), ...[...new Set(p.relationships.map(r => r.kind))].map(k => p.relationLabels[k])];",
  content: "return [p.courts.origin, ...p.courts.venues.map(v => v.name), ...p.routes.filter(r => r.venue < p.courts.venues.length).map(r => r.datum), p.file.label, ...p.elements.map(e => e.label)];",
  captions: "return [p.seats.arrival, p.seats.waiting, p.labels.junction, ...[...new Set(p.relationships.map(r => r.kind))].map(k => p.relationLabels[k])];",
});

const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
// each connector's two ends touch its own two parts (rendered)
const ENDS = `(() => {
  const s = svg.querySelectorAll('[data-node^="cn"][data-node$="-line"]');
  return s.length > 0;
})()`;

// no connector (or label leader) runs through any text: part titles, captions, names, relation labels (its own chip,
// which sits on its line only as a last resort, excepted); the few px at each end are ignored
const NO_TEXT_CROSS = `(() => {
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
  const tb = texts.map(t => ({r: t.getBoundingClientRect(), own: (t.closest('[data-node^="rl"]') || {}).getAttribute ? t.closest('[data-node^="rl"]').getAttribute('data-node') : null}));
  for (const path of svg.querySelectorAll('[data-node^="cn"][data-node$="-line"]')) {
    const i = path.getAttribute('data-node').replace(/^cn(\\d+)-line$/, '$1');
    const m = path.getScreenCTM(), L = path.getTotalLength();
    const a = path.getPointAtLength(0).matrixTransform(m), b = path.getPointAtLength(L).matrixTransform(m);
    for (let j = 1; j < 80; j++) {
      const q = path.getPointAtLength((L * j) / 80).matrixTransform(m);
      if (Math.hypot(q.x - a.x, q.y - a.y) < 8 || Math.hypot(q.x - b.x, q.y - b.y) < 8) continue;
      if (tb.some(o => o.own !== 'rl' + i && q.x > o.r.left + 1 && q.x < o.r.right - 1 && q.y > o.r.top + 1 && q.y < o.r.bottom - 1)) return false;
    }
  }
  return true;
})()`;
// people: the sorting clerk and the receiving clerk >= 60 px across (1080p) at rest, build and hold
const PEOPLE = `(() => { const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));
  return ['sw-clerk', 'mr-clerk'].every(n => { const e = svg.querySelector('[data-node="' + n + '"]'); if (!e) return false; const b = e.getBoundingClientRect(); return Math.min(b.width, b.height) / K >= 60; });
})()`;

// connectors (sampled paths, 1080p px): no two cross; no two end within 30 px of each other (each on its own port)
const PATHS = `const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));
  const samp = (p, n) => { const m = p.getScreenCTM(), L = p.getTotalLength(); return Array.from({length: n + 1}, (_, j) => p.getPointAtLength((L * j) / n).matrixTransform(m)); };
  const lines = [...svg.querySelectorAll('[data-node^="cn"][data-node$="-line"]')].map(p => ({i: p.getAttribute('data-node').replace(/^cn(\\d+)-line$/, '$1'), pts: samp(p, 80)}));
  const cr = (a, b, c, d) => { const o = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x); return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0; };`;
const NO_CROSS = `(() => { ${PATHS}
  for (let a = 0; a < lines.length; a++) for (let b = a + 1; b < lines.length; b++) {
    const P = lines[a].pts, Q = lines[b].pts;
    for (let j = 1; j < P.length; j++) for (let k = 1; k < Q.length; k++) if (cr(P[j - 1], P[j], Q[k - 1], Q[k])) return false;
  }
  return true;
})()`;
const OWN_PORTS = `(() => { ${PATHS}
  const ends = lines.flatMap(l => [l.pts[0], l.pts[l.pts.length - 1]].map(q => ({i: l.i, q})));
  for (let a = 0; a < ends.length; a++) for (let b = a + 1; b < ends.length; b++) if (ends[a].i !== ends[b].i && Math.hypot(ends[a].q.x - ends[b].q.x, ends[a].q.y - ends[b].q.y) / K < 30) return false;
  return true;
})()`;
// every connector end that touches the venues part lies on (within 3 px of) one of the building fronts
const ON_BUILDING = `(() => { ${PATHS}
  const blds = [...svg.querySelectorAll('[data-node^="mv-bld"]')].filter(e => /^mv-bld\\d+$/.test(e.getAttribute('data-node'))).map(e => e.getBoundingClientRect());
  const V = svg.querySelector('[data-node="el-venues"]').getBoundingClientRect();
  const ends = lines.flatMap(l => [l.pts[0], l.pts[l.pts.length - 1]]).filter(q => q.x >= V.left - 3 && q.x <= V.right + 3 && q.y >= V.top - 3 && q.y <= V.bottom + 3);
  return ends.length > 0 && ends.every(q => blds.some(b => q.x >= b.left - 3 && q.x <= b.right + 3 && q.y >= b.top - 3 && q.y <= b.bottom + 3));
})()`;
// labels: every chip covers <= 10 % of its own line and none of another line; leaders keep >= 8 px from other lines and
// from other leaders (no shared leader)
const LABELS_OWN = `(() => { ${PATHS}
  const inR = (q, r, pad = 0) => q.x > r.left - pad && q.x < r.right + pad && q.y > r.top - pad && q.y < r.bottom + pad;
  const leaders = [...svg.querySelectorAll('[data-node$="-leader"]')].filter(visible).map(p => ({i: p.getAttribute('data-node').replace(/^rl(\\d+)-leader$/, '$1'), pts: samp(p, 30)}));
  for (const c of svg.querySelectorAll('[data-node$="-chip"]')) {
    if (!visible(c)) continue;
    const i = c.getAttribute('data-node').replace(/^rl(\\d+)-chip$/, '$1');
    const r = c.getBoundingClientRect();
    for (const l of lines) {
      const frac = l.pts.filter(q => inR(q, r)).length / l.pts.length;
      if (l.i === i ? frac > 0.1 : frac > 0) return false;
    }
  }
  const chips = [...svg.querySelectorAll('[data-node$="-chip"]')].filter(visible).map(c => ({i: c.getAttribute('data-node').replace(/^rl(\\d+)-chip$/, '$1'), r: c.getBoundingClientRect()}));
  for (const ld of leaders) {
    // a leader reaches only its own chip: it passes through no other chip
    for (const c of chips) if (c.i !== ld.i && ld.pts.some(q => inR(q, c.r, 2))) return false;
    for (const l of lines) if (l.i !== ld.i && ld.pts.slice(3).some(q => l.pts.some(w => Math.hypot(w.x - q.x, w.y - q.y) / K < 8))) return false;
    for (const o of leaders) if (o !== ld && ld.pts.some(q => o.pts.some(w => Math.hypot(w.x - q.x, w.y - q.y) / K < 8))) return false;
  }
  return true;
})()`;

ratioChecks(ID, 'fill, sizes, ends', [
  {at: [1], dom: NO_CROSS, label: 'rendered: no two connectors cross'},
  {at: [1], dom: OWN_PORTS, label: 'rendered: every connector ends on its own port (no two ends within 30 px)'},
  {at: [1], tv: ['all'], dom: LABELS_OWN, label: 'rendered: each label chip covers <= 10 % of its own line and none of another; no shared or crossing leader'},
  {at: [1], dom: NO_TEXT_CROSS, label: 'rendered: no connector runs through any text (titles included)'},
  {at: [0, 0.3, 0.6, 1], dom: PEOPLE, label: 'rendered: both clerks >= 60 px across at rest, build and hold'},
  {at: [1], fn: "s.connPorts.every(([a, b], i) => s.arrows[i].from !== 'venues' || s.arrows[i].to !== 'room' || s.selected < 0 || a === 'venue' + s.selected)", label: 'venues → desk: the link leaves the matched venue\'s building'},
  {at: [1], dom: ON_BUILDING, label: 'rendered: every link to the venues ends on a building (never on the gap between two)'},
  {at: [1], dom: FILL, label: 'rendered: the parts fill the caption-safe box'},
  {at: [1], dom: ENDS, label: 'rendered: the connectors are drawn'},
  {at: [1], fn: 's.problems.length === 0 && s.labelsClear', label: 'the composition fits without problems'},
  {at: [1], fn: 's.connectorGaps.every(gp => gp <= 2)', label: 'every connector ends on its part edge'},
  {at: [0.3, 0.6, 0.9], fn: "s.arrows.every(a => a.kind !== 'relation' || !a.arrow)", label: 'plain relations have no arrowheads'},
]);

// Rendered (pattern of LAW-0194/0196/0688): EVERY visible text — titles, captions, key, legend, chips — is >= 16 px at 1080p
// at every sampled u in every preset × ratio, and >= 19.5 px in default, baseline-illustrative and baseline-es.
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
