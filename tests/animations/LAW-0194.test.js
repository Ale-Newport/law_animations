// LAW-0194 — Consulta de expediente por auxiliar · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends at its element, the order does not change when seeking, and a
// plain relation is never drawn as causation (no arrow; causal only when supplied).
// Windows (LAW-0194.js W): the piece slides out of its slot and the bubble grows 0.03–0.16 (texts 0.10–0.17),
// relationships drawn one by one 0.18–0.41, tracer 0.45–0.72 (fades by 0.76), the piece shown back in its slot
// (state) 0.74–0.79, legend and key 0.76–0.82.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';

const ID = 'LAW-0194';

// Rendered: every relation label's nearest connector is its OWN, within 40 px (at 1080p) and at least 8 px closer
// than any other connector. Label i = group [data-node="rl<i>"] (chip shapes and text; the dotted leader is
// excluded), connector i = path [data-node="rgp-c<i>-line"], sampled along its length. A label's leader crosses
// no text.
const OWN_NEAREST = `(() => {
  const vb = svg.viewBox.baseVal;
  const k = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));
  const conns = [];
  for (const path of svg.querySelectorAll('[data-node^="rgp-c"][data-node$="-line"]')) {
    const i = +path.getAttribute('data-node').match(/^rgp-c(\\d+)-line$/)[1];
    const m = path.getScreenCTM(), L = path.getTotalLength(), pts = [];
    for (let j = 0; j <= 160; j++) pts.push(path.getPointAtLength((L * j) / 160).matrixTransform(m));
    conns[i] = pts;
  }
  const labels = [...svg.querySelectorAll('[data-node^="rl"]')].filter(e => /^rl\\d+$/.test(e.getAttribute('data-node')));
  if (!labels.length) return false;
  const texts = [...svg.querySelectorAll('text')].filter(t => (t.textContent || '').trim());
  for (const lab of labels) {
    const i = +lab.getAttribute('data-node').slice(2);
    const rs = [...lab.querySelectorAll('path,rect,text')].map(e => e.getBoundingClientRect()).filter(r => r.width > 0);
    if (!rs.length || !conns[i]) return false;
    const b = {l: Math.min(...rs.map(r => r.left)), t: Math.min(...rs.map(r => r.top)), r: Math.max(...rs.map(r => r.right)), b: Math.max(...rs.map(r => r.bottom))};
    const dist = pts => Math.min(...pts.map(q => Math.hypot(Math.max(b.l - q.x, 0, q.x - b.r), Math.max(b.t - q.y, 0, q.y - b.b)))) / k;
    const own = dist(conns[i]);
    if (own > 40) return false;
    for (const [j, pts] of conns.entries()) if (pts && j !== i && dist(pts) < own + 8) return false;
    const leader = lab.querySelector('line');
    if (leader) {
      const a = leader.getBoundingClientRect();
      for (const t of texts) {
        if (lab.contains(t)) continue;
        const tb = t.getBoundingClientRect();
        if (a.left < tb.right && a.right > tb.left && a.top < tb.bottom && a.bottom > tb.top) return false;
      }
    }
  }
  return true;
})()`;

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.separated === 0 && !s.pieceOut && s.pieceShownInSlot === 1 && s.relationsDrawn.every(p => p === 0)', label: 'start: the piece in its slot, nothing separated, nothing related'},
    {at: 0.17, fn: 's.separated === 1 && s.pieceOut && s.pieceShownInSlot === 0 && s.relationsDrawn.every(p => p === 0)', label: 'separate: the piece is out of its slot (dashed outline) before any relationship is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relationships are drawn one by one'},
    {at: 0.42, fn: 's.relationsDrawn.every(p => p === 1) && !s.tracerVisible', label: 'all relationships exist before the marker moves'},
    {at: 0.6, fn: "s.tracerVisible && s.visitOrder.length >= 2 && JSON.stringify(s.visitOrder) === JSON.stringify(['requester','request','assistant','piece','desk','slot'].slice(0, s.visitOrder.length))", label: 'the marker follows the supplied traversal order'},
    {at: 0.62, fn: 's.focusScale > 1.1', label: 'the focus element (the piece with its numbered tab) enlarges while the marker passes'},
    {at: 0.8, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['requester','request','assistant','piece','desk','slot']) && s.focusScale === 1 && s.pieceShownInSlot === 1 && s.stateShown === 1", label: 'main action complete by 0.8: full order visited, focus back to size, the piece shown back in its slot'},
    {at: 1, fn: 's.legendShown === 1 && !s.tracerShown && s.ringsVisible.length === 0 && s.labelsFit', label: 'gather: legend shown, neutral hold (no marker or ring), layout fits'},
    {at: 0.6, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['requester','request','assistant','piece','desk','slot'].slice(0, s.visitOrder.length))", label: 'seeking back (after the end) gives the same partial order'},
    {at: 1, fn: 's.connectorGaps.length === 12 && s.connectorGaps.every(g => g <= 16)', label: 'every connector ends at its element edge'},
    {at: 1, fn: "s.arrows.every(a => a.kind === 'relation' ? !a.arrow : true) && s.arrows.every(a => a.kind !== 'causal')", label: 'the plain relation has no arrowhead; no causal link unless supplied'},
    {at: 1, params: {relationships: [{from: 'piece', to: 'slot', kind: 'causal', label: 'as supplied'}]}, fn: "s.arrows.length === 1 && s.arrows[0].kind === 'causal' && s.arrows[0].arrow", label: 'a causal link is drawn only when supplied'},
    {at: 1, params: {traversalOrder: ['slot', 'desk', 'piece']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['slot', 'desk', 'piece'])", label: 'a different traversal order is followed as supplied'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.relationsDrawn.every(p => p === 1) && s.visitOrder.length === 6 && s.pieceShownInSlot === 1', label: 'the mechanism reads with labels hidden'},
    {at: 1, params: {roles: {assistant: 'Test role A', requester: 'Test role R'}}, fn: "s.nameTexts[0].includes('Test role R') && s.nameTexts[1].includes('Test role A')", label: 'roles drive the role text drawn beside each person'},
  ],
});

suppliedTextSuite(ID, {
  fields: `const kinds = [...new Set(p.relationships.map(r => r.kind))];
    return [p.actors[0].name, p.actors[1].name, ...p.elements.map(e => e.label), p.props.request, p.props.fileLabel,
      ...p.props.pieces.map(q => q.title), ...p.relationships.map(r => r.label), ...kinds.map(k => p.relationLabels[k])]`,
  content: `const kinds = [...new Set(p.relationships.map(r => r.kind))];
    return [p.actors[0].name, p.actors[1].name, ...p.elements.map(e => e.label), p.props.request,
      ...p.props.pieces.map(q => q.title), ...p.relationships.map(r => r.label), ...kinds.map(k => p.relationLabels[k])]`,
  captions: 'return ["as supplied", "según lo aportado"]',
});

ratioChecks(ID, 'layout fits; labels beside their own connectors; connectors distinct and readable', [
  {at: [1], fn: 's.labelsFit', label: 'components, names, state, legend and key fit'},
  // review round 1: a connector to the slot lands on the supplied slot's own row, never on a neighbouring row
  {at: [1], fn: 's.slotEndsInRow.length > 0 && s.slotEndsInRow.every(Boolean)', label: 'connectors to the slot end inside the supplied slot row'},
  {at: [1], fn: 's.labelsOffConnectors && s.crossings === 0 && s.connectorsClearOfChips && s.minConn >= 70', label: 'labels off every connector; no crossings; connectors clear of chips and ≥ 70 px'},
  {at: [1], fn: '!s.tracerShown && s.ringsVisible.length === 0', label: 'neutral hold: no marker or ring left'},
  {at: [1], fn: 's.relLabelsUnambiguous && s.relLabelMaxDist <= 40', label: 'every relation label within 40 px of its own connector, others clearly further', tv: ['all']},
  {at: [1], dom: OWN_NEAREST, label: "rendered: each relation label's nearest connector is its own (≤ 40 px, others ≥ 8 px further); leaders cross no text", tv: ['all']},
]);

// Review round 2 — Coordinator decision 2026-09-26: visible text is never below 16 px at 1080p, at every sampled time (while the
// context yields room for the lens too), not only at the hold.
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
