// LAW-0214 — Sala física y remota · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends at its component, the order does not change when seeking, and a
// relation is not drawn as causality by default (plain relations: solid line with end dots, never an arrow).
// Timing (u): separate 0.02–0.15 (components slide from the assembled plan to their places); relationships drawn
// one by one 0.20–0.42 (when the supplied bench–windows relationship lands, the windows light and their
// participants sit); tracer 0.45–0.72 (the focus component enlarges while it passes); legend 0.75–0.81; still from
// 0.81. Legal (strict): shipped presets use plain relations (and one captioned "sequence as configured
// (illustrative)"); no dashed line is drawn between the bench and the windows; the key says no conclusion.
// Coordinator decision (standing stress rule, 2026-09-26): see `coordinatorDecision` in LAW-0214.presets.json.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0214';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ORDER = 'JSON.stringify(s.visitOrder)';

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.relationsDrawn.every(p => p === 0) && s.slide === 0 && !s.windowsLinked && s.remoteSeated === 0', label: 'separate: parts start assembled; nothing drawn; windows not linked'},
    {at: 0.18, fn: 's.slide === 1 && s.relationsDrawn.every(p => p === 0)', label: 'the parts are apart before any relationship is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relationships are drawn one by one'},
    {at: 0.435, fn: 's.relationsDrawn.every(p => p === 1) && s.windowsLinked && s.remoteSeated === 1 && !s.tracerVisible', label: 'all supplied relationships exist before the tracer moves; the windows are linked, their participants seated'},
    {at: 0.5, fn: `${ORDER} === JSON.stringify(['building'])`, label: 'the tracer starts at the first supplied component'},
    {at: 1, fn: `${ORDER} === JSON.stringify(['building','room','bench','windows'])`, label: 'the tracer followed the supplied order'},
    {at: 0.3, fn: `${ORDER} === '[]'`, label: 'seeking back: the order restarts'},
    {at: 1, fn: 's.connectorGaps.length === 3 && s.connectorGaps.every(g => g <= 10)', label: 'every connector ends at its component edge'},
    {at: 1, fn: "s.arrows.every(a => a.kind === 'relation' ? !a.arrow : true) && s.arrows.every(a => a.kind !== 'causal')", label: 'plain relations have no arrowhead; no causal link unless supplied'},
    {at: 0.61, fn: 's.focusScale > 1.1', label: 'the focus component (the bench) enlarges while the tracer passes'},
    {at: 1, params: {traversalOrder: ['windows', 'bench', 'room']}, fn: `${ORDER} === JSON.stringify(['windows','bench','room'])`, label: 'a different supplied order is followed as supplied'},
    {at: 1, params: {relationships: [{from: 'building', to: 'room', kind: 'relation', label: 'contains'}]}, fn: '!s.windowsLinked && s.remoteSeated === 0', label: 'without a supplied bench–windows relationship nothing links (nothing invented)'},
    {at: 1, params: P('contrast-or-alternative'), fn: `${ORDER} === JSON.stringify(['room','bench','windows']) && s.windowsLinked`, label: 'alternative: the supplied order and relations'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.relationsDrawn.every(p => p === 1) && s.windowsLinked && s.remoteSeated === 1', label: 'labels hidden: the same map, connection and seats'},
    {at: 1, fn: 's.problems.length === 0 && s.labelsClear', label: 'layout: every caption and label found a clear place'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const kinds = [...new Set(p.relationships.map(q => q.kind))]; const seats = p.routes.map(r => p.seats[r.seat] && p.seats[r.seat].label).filter(Boolean); return [p.courts.building, p.courts.room, ...p.elements.map(e => e.label), ...p.relationships.map(q => q.label || p.relationLabels[q.kind]), ...kinds.map(k => p.relationLabels[k]), ...seats, p.labels.key];",
  content: "const seats = p.routes.map(r => p.seats[r.seat] && p.seats[r.seat].label).filter(Boolean); return [...p.elements.map(e => e.label), ...seats];",
  captions: "const kinds = [...new Set(p.relationships.map(q => q.kind))]; return kinds.map(k => p.relationLabels[k]);",
});

const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const HEADS = "const heads = [...svg.querySelectorAll('[data-node]')].filter(e => /^(rp\\d+|wp\\d+|bp)-head$/.test(e.getAttribute('data-node'))).map(bx);";
const NO_CARD_ON_FACE = `(() => { ${K} ${BOX} ${HEADS}
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^((rlab|wlab)\\d+-body|blab-body|cap-\\w+|rel-l\\d+|legend)$/.test(e.getAttribute('data-node')) && visible(e)).map(bx);
  return heads.length > 0 && cards.every(c => heads.every(h => !hit(c, h, 1)));
})()`;
// each people label within 40 px of its own person, the leader ends on them and crosses no text or head
const LABEL_OWNS = `(() => { ${K} ${BOX} ${HEADS}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^((rlab|wlab)\\d+|blab)$/.test(e.getAttribute('data-node')) && visible(e));
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
    if (pts.some(q => [...texts.filter(t => !lab.contains(t)).map(bx), ...heads].some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b))) return false;
  }
  return true;
})()`;
// each relation label's nearest connector is its own (<= 40 px), any other >= 8 px further
const OWN_NEAREST = `(() => { ${K}
  const conns = [];
  for (const path of svg.querySelectorAll('[data-node$="-line"]')) {
    const mm = (path.getAttribute('data-node') || '').match(/^rel-c(\\d+)-line$/);
    if (!mm) continue;
    const m = path.getScreenCTM(), L = path.getTotalLength(), pts = [];
    for (let j = 0; j <= 120; j++) pts.push(path.getPointAtLength((L * j) / 120).matrixTransform(m));
    conns[+mm[1]] = pts;
  }
  const labels = [...svg.querySelectorAll('[data-node^="rel-l"]')].filter(e => visible(e));
  if (!labels.length) return false;
  for (const lab of labels) {
    const i = +lab.getAttribute('data-node').slice(5);
    const r0 = lab.getBoundingClientRect();
    const b = {l: r0.left, t: r0.top, r: r0.right, b: r0.bottom};
    const dist = pts => Math.min(...pts.map(q => Math.hypot(Math.max(b.l - q.x, 0, q.x - b.r), Math.max(b.t - q.y, 0, q.y - b.b)))) / K;
    const own = dist(conns[i]);
    if (own > 40) return false;
    if (conns.some((pts, j) => pts && j !== i && dist(pts) < own + 8)) return false;
  }
  return true;
})()`;
const PEOPLE_SIZE = `(() => { ${K}
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^(rp\\d+|wp\\d+|bp)$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); const r = e.getBoundingClientRect(); return Math.max(hd.width, hd.height) / K >= 26 && Math.max(r.width, r.height) / K >= 60; });
})()`;
// equal weight: the people in the room, at the bench and in the windows share one scale (outside the focus
// enlargement), one label font size and one chip stroke
const EQUAL_WEIGHT = `(() => {
  const sc = [...svg.querySelectorAll('[data-node]')].filter(e => /^(rp\\d+|wp\\d+|bp)$/.test(e.getAttribute('data-node'))).map(e => { const m = e.getScreenCTM(); return Math.hypot(m.a, m.b); });
  const fonts = [...svg.querySelectorAll('[data-node]')].filter(e => /^((rlab|wlab)\\d+|blab)-text$/.test(e.getAttribute('data-node'))).map(e => e.getAttribute('font-size'));
  const strokes = [...svg.querySelectorAll('[data-node]')].filter(e => /^((rlab|wlab)\\d+|blab)-body$/.test(e.getAttribute('data-node'))).map(e => e.getAttribute('stroke-width') + '/' + (e.getAttribute('stroke-dasharray') || ''));
  return sc.length > 1 && Math.max(...sc) / Math.min(...sc) < 1.005 && new Set(fonts).size <= 1 && new Set(strokes).size <= 1;
})()`;
// no dashed line between the bench and the windows in any shipped preset (dashes mean disputed / pending)
const LINK_SOLID = `(() => {
  const lines = [...svg.querySelectorAll('[data-node]')].filter(e => /^rel-c\\d+-line$/.test(e.getAttribute('data-node')));
  return lines.every(e => { const da = e.getAttribute('stroke-dasharray') || ''; const v = da.split(/[ ,]+/).map(Number); return !v[0] || v[0] >= e.getTotalLength() - 1; });
})()`;
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
const IN_FRAME = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; return p1.x >= -1 && p1.y >= -1 && p2.x <= vb.width + 1 && p2.y <= vb.height + 1; })()";
const OPAQUE = "[...svg.querySelectorAll('[data-node]')].filter(e => /^(rp\\d+|wp\\d+|bp)$/.test(e.getAttribute('data-node'))).every(e => visible(e) && !e.getAttribute('opacity'))";

ratioChecks(ID, 'labels own their connectors and people, equal weight, solid shipped links, large parts', [
  {at: times(0, 1, 0.05), dom: NO_CARD_ON_FACE, label: 'rendered: no caption, label or legend covers a head'},
  {at: [1], tv: ['all'], dom: LABEL_OWNS, label: 'rendered: each people label within 40 px of its own person; leaders end on them and cross no text or head'},
  {at: [1], tv: ['all'], dom: OWN_NEAREST, label: "rendered: each relation label's nearest connector is its own (<= 40 px; others >= 8 px further)"},
  {at: times(0, 1, 0.1), dom: PEOPLE_SIZE, label: 'rendered: people >= 60 px across and heads >= 26 px (1080p) at every sampled time'},
  {at: [0, 0.3, 1], dom: EQUAL_WEIGHT, label: 'rendered: room, bench and window participants share one scale, one label size and one chip stroke'},
  {at: [0.5, 1], dom: LINK_SOLID, label: 'rendered: shipped connectors are solid (no dashes)'},
  {at: [1], dom: FILL, label: 'rendered: the exploded plan fills the caption-safe box'},
  {at: times(0, 1, 0.1), dom: IN_FRAME, label: 'rendered: nothing leaves the frame'},
  {at: times(0, 1, 0.1), dom: OPAQUE, label: 'rendered: people are always whole and opaque'},
  {at: [1], fn: 's.connectorGaps.every(g => g <= 10)', label: 'every connector ends at its component edge'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0 && s.labelsClear', label: 'every caption and label found a clear place'},
]);

test.describe(`${ID} text size over time`, () => {
  test(`${ID}: every visible text >= 16 px (>= 19.5 px in baseline and baseline-es) at every sampled u`, async ({page}) => {
    test.setTimeout(300000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
        const floor = ['default', 'baseline-illustrative', 'baseline-es'].includes(pr.name) ? 19.5 : 16;
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
              if (pxs < floor - 0.05) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: "${t.textContent.slice(0, 24)}" ${pxs.toFixed(1)} px < ${floor}`);
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
