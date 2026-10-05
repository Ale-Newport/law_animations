// LAW-0223 — Organización de turnos · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (the supplied turn state of the focus
// participant: in A the signal is passed to them, in B to another participant as supplied while they wait), and no
// legal consequence is invented to complete the contrast (no winner, outcome, rule or consequence of waiting).
// Timing (u): base 0–0.17 (A and B identical); the receiver's hand goes out 0.19–0.30 and the headers appear 0.32–0.38;
// the pass runs with the same timing in both scenes 0.42–0.74; guide rings and chip 0.78–0.84; neutral note 0.82–0.86.
// Legal: equal weight (same size, same timing, same parties); "pending" only means waiting; no dashes; the key says
// "as supplied · no conclusion drawn".
// Coordinator decision (standing stress rule, 2026-09-26, AUTHORING item 20; reason corrected in courts-06 review 1): the
// near-maximum texts lay out at 1:1 with people at 47.3 px; the long-labels-stress texts are capped as a quality choice
// that raises the people to 63.7 px (rendered, 1:1), every field still strictly longer than baseline.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0223';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['tokenA', 'tokenB'],
  semantic: [
    {at: 0.1, fn: "s.scenes === 2 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.A.holder === 'Participant B' && s.lookA.header === 0", label: 'base: two identical complete scenes, the same holder, no header yet'},
    {at: 0.3, fn: "JSON.stringify(s.lookA.hands) !== JSON.stringify(s.lookB.hands) && JSON.stringify(s.lookA.lamps) === JSON.stringify(s.lookB.lamps) && JSON.stringify(s.lookA.token) === JSON.stringify(s.lookB.token)", label: 'the change: only the receiving hand differs; lamps and token unchanged (cause before effect)'},
    {at: 0.4, fn: 's.lookA.header === 1 && s.lookB.header === 1', label: 'both headers shown together'},
    {at: 0.55, fn: 'JSON.stringify(s.A.lamps.map((v, i) => i === 0 ? v : 0)) === JSON.stringify(s.B.lamps.map((v, i) => i === 0 ? v : 0))', label: 'parallel: the holders lamps change at the same time in A and B'},
    {at: 1, fn: "s.A.holder === 'Participant C' && s.B.holder === 'Participant D' && s.focusLit.A === 1 && s.focusLit.B === 0 && s.focus === 'Participant C' && s.allReached", label: 'A: the focus participant\u2019s turn is active; B: it is pending while another holds the signal'},
    {at: 1, fn: 'JSON.stringify(s.lookA.people) === JSON.stringify(s.lookB.people)', label: 'only the supplied fact differs: every person keeps the same seat in A and B'},
    {at: 1, fn: 's.guide === 1 && s.problems.length === 0', label: 'guide shown; no fallback layout'},
    {at: 1, params: {scenarioB: {label: 'B', caption: 'x', next: 2}}, fn: "JSON.stringify(s.lookA.lamps) === JSON.stringify(s.lookB.lamps) && JSON.stringify(s.lookA.token) === JSON.stringify(s.lookB.token)", label: 'identical supplied receivers give identical scenes (nothing inferred)'},
    {at: 0.6, params: {textVisibility: 'none'}, fn: 'JSON.stringify(s.lookA.token) !== JSON.stringify(s.lookB.token)', label: 'labels hidden: the tokens take different paths'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: "return [p.courts.building, p.courts.room, ...p.seats.map(s => s.label), p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral, p.labels.active, p.labels.pending, p.labels.key];",
  content: 'return [...p.seats.map(s => s.label), p.scenarioA.label, p.scenarioB.label, p.changedFact, p.labels.active, p.labels.pending];',
  captions: 'return [p.labels.circle, p.labels.diamond];',
});

// ---------------------------------------------------------------------------------------------
// Rendered checks (every preset × ratio × labels shown/hidden). Distances in px at 1080p.
const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const EFF = "const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };";
const HEADS = "const heads = [...svg.querySelectorAll('[data-node$=\"-head\"]')].filter(e => /^[AB]-p\\d+-head$/.test(e.getAttribute('data-node'))).map(bx);";
// every visible card (seat chips, panel items, notes) is clear of every head
const NO_CARD_ON_FACE = `(() => { ${BOX} ${HEADS}
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^(lab\\d+-body|room-name|bld-name|state-tag|note\\d+|key|legend-\\w+)$/.test(e.getAttribute('data-node')) && visible(e)).map(bx);
  return heads.length > 0 && cards.every(c => heads.every(h => !hit(c, h, 1)));
})()`;
// each chip within 40 px of its own person, the leader ends on that person, crosses no other text, chip or head
const LABEL_OWNS_SEAT = `(() => { ${K} ${BOX} ${HEADS}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^lab\\d+$/.test(e.getAttribute('data-node')) && visible(e));
  if (!labs.length) return false;
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
  for (const lab of labs) {
    const i = lab.getAttribute('data-node').slice(3);
    const body = bx(svg.querySelector('[data-node="lab' + i + '-body"]'));
    const pb = bx(svg.querySelector('[data-node="' + lab.getAttribute('data-owner') + '"]'));
    const gap = Math.max(0, Math.max(pb.l - body.r, body.l - pb.r), Math.max(pb.t - body.b, body.t - pb.b)) / K;
    if (gap > 40) return false;
    const line = svg.querySelector('[data-node="lab' + i + '-lead"]');
    const m = line.getScreenCTM();
    const B = new DOMPoint(+line.getAttribute('x2'), +line.getAttribute('y2')).matrixTransform(m), A = new DOMPoint(+line.getAttribute('x1'), +line.getAttribute('y1')).matrixTransform(m);
    if (!(B.x >= pb.l - 2 && B.x <= pb.r + 2 && B.y >= pb.t - 2 && B.y <= pb.b + 2)) return false;
    const pts = Array.from({length: 10}, (_, j) => ({x: A.x + (B.x - A.x) * (0.1 + 0.8 * j / 9), y: A.y + (B.y - A.y) * (0.1 + 0.8 * j / 9)}));
    const others = [...texts.filter(t => !lab.contains(t)).map(bx), ...labs.filter(o => o !== lab).map(o => bx(svg.querySelector('[data-node="' + o.getAttribute('data-node') + '-body"]'))), ...heads];
    if (pts.some(q => others.some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b))) return false;
  }
  return true;
})()`;
// chips stay off every mark: lamps, the token, note rings, party badges, plants and the tray
const CHIPS_OFF_MARKS = `(() => { ${EFF} ${BOX}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^lab\\d+-body$/.test(e.getAttribute('data-node')) && eff(e) > 0.05).map(bx);
  const marks = [...svg.querySelectorAll('[data-node="notes"] circle, [data-node="notes"] rect, [data-node^="rm-plant"], [data-node^="rm-badge"], [data-node^="rm-lamp"], [data-node="token"], [data-node="rm-tray"]')].filter(e => eff(e) > 0.05 && e.getBoundingClientRect().width > 0.5).map(bx);
  return labs.every(l => marks.every(m => !hit(l, m)));
})()`;
// people and their heads are large enough to read (px at 1080p)
const PEOPLE_SIZE = `(() => { ${K}
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); const b = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').parentNode.getBoundingClientRect(); const s = e.getBoundingClientRect(); return hd.width / K >= 26 && Math.min(s.width, s.height) / K >= 60; });
})()`;
// the scene fills the caption-safe box (>= 90 % on its long axis, >= 72 % on the other)
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
const IN_FRAME = "(() => { const vb = svg.viewBox.baseVal; const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); return p1.x >= -1 && p1.y >= -1 && p2.x <= vb.width + 1 && p2.y <= vb.height + 1; })()";
const OPAQUE = "[...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node'))).every(e => visible(e) && !e.getAttribute('opacity'))";
// equal weight of the two parties: every party badge the same size; nothing in the plan is dashed
const EQUAL_PARTIES = `(() => {
  const bs = [...svg.querySelectorAll('[data-node^="rm-badge"]')].filter(e => /^rm-badge\\d+$/.test(e.getAttribute('data-node'))).map(e => e.getBoundingClientRect());
  if (bs.length < 2 || bs.some(b => Math.abs(b.width - bs[0].width) > 0.5 || Math.abs(b.height - bs[0].height) > 0.5)) return false;
  return ![...svg.querySelector('[data-node="plan"]').querySelectorAll('*')].some(e => e.getAttribute('stroke-dasharray'));
})()`;
const NO_MARKERS = "!svg.querySelector('[marker-end], marker')";
// the token is always under a hand, or gliding: while someone holds it, one of their hands covers it
const TOKEN_IN_HAND = `(() => { ${BOX}
  const tk = svg.querySelector('[data-node="token"]').getBoundingClientRect();
  const c = {x: (tk.left + tk.right) / 2, y: (tk.top + tk.bottom) / 2};
  const hands = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+-arm[LR]-h$/.test(e.getAttribute('data-node'))).map(e => e.getBoundingClientRect());
  return hands.some(hd => Math.hypot((hd.left + hd.right) / 2 - c.x, (hd.top + hd.bottom) / 2 - c.y) <= tk.width * 0.6);
})()`;
// AUTHORING: baseline presets (baseline-es included) render every visible text >= 19.5 px (1080p) in every ratio
const TEXT_195 = `(() => { ${EFF}
  const s0 = svg.getScreenCTM().a; const vb = svg.viewBox.baseVal;
  const ts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]') && eff(t) >= 0.05 && (t.textContent || '').trim() && t.getBoundingClientRect().width >= 0.5);
  return ts.length > 0 && ts.every(t => parseFloat(getComputedStyle(t).fontSize) * (t.getScreenCTM().a / s0) * 1080 / Math.min(vb.width, vb.height) >= 19.5 - 0.05);
})()`;

// each scene's drawn plan measured against the FRAME width: >= 40 % side by side, >= 71 % stacked; both the same size
const SCENE_SHARE = `(() => { const m = svg.getScreenCTM(); const vb = svg.viewBox.baseVal;
  const r0 = k => svg.querySelector('[data-node="' + k + '-rm-room"]').getBoundingClientRect();
  const a = r0('A'), b = r0('B'); const stacked = a.bottom <= b.top + 1 || b.bottom <= a.top + 1;
  if (Math.abs(a.width - b.width) > 1 || Math.abs(a.height - b.height) > 1) return false;
  return [a, b].every(q => q.width / m.a / vb.width >= (stacked ? 0.71 : 0.4));
})()`;
// the guide rings: the same size in both scenes, each around the focus participant's lamp
const RINGS_EQUAL = "(() => { const a = svg.querySelector('[data-node=\"A-ring\"]').getBoundingClientRect(), b = svg.querySelector('[data-node=\"B-ring\"]').getBoundingClientRect(); return Math.abs(a.width - b.width) < 1 && a.width > 5; })()";
const NO_DASHES = "![...svg.querySelectorAll('[data-node=\"A-scene\"] *, [data-node=\"B-scene\"] *')].some(e => e.getAttribute('stroke-dasharray')) && !svg.querySelector('[marker-end], marker')";

ratioChecks(ID, 'scenes equal and large, people large, cards off faces, text floors', [
  {at: times(0, 1, 0.05), dom: NO_CARD_ON_FACE.replace('lab\\d+-body', '[AB]-lab\\d+-body'), label: 'rendered: no chip or panel item covers a head'},
  {at: [0, 0.5, 1], dom: PEOPLE_SIZE.replace("/^p\\d+$/", "/^[AB]-p\\d+$/"), label: 'rendered: people >= 60 px across and heads >= 26 px (1080p) in both scenes'},
  {at: [0.1, 0.5, 1], dom: SCENE_SHARE, label: 'rendered: both scenes the same size, each >= 40 % of the FRAME width side by side, >= 71 % stacked'},
  {at: [1], dom: RINGS_EQUAL, label: 'rendered: the guide rings are the same size in both scenes'},
  {at: [0.5, 1], dom: NO_DASHES, label: 'rendered: nothing dashed in either scene; no arrow markers'},
  {at: [1], dom: FILL, label: 'rendered: scenes and strip fill the caption-safe box'},
  {at: [0, 0.5, 1], dom: IN_FRAME, label: 'rendered: nothing leaves the frame'},
  {at: times(0, 1, 0.1), dom: OPAQUE.replace("/^p\\d+$/", "/^[AB]-p\\d+$/"), label: 'rendered: people are always whole and opaque'},
  {at: [0.1, 0.5, 1], tv: ['all'], presets: ['baseline-illustrative', 'baseline-es'], dom: TEXT_195, label: 'rendered: baseline and baseline-es: every visible text >= 19.5 px in every ratio'},
  {at: times(0.4, 0.78, 0.02), fn: 's.allReached', label: 'hands within reach through the pass'},
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
              const pxs = parseFloat(getComputedStyle(t).fontSize) * (t.getScreenCTM().a / s0) * 1080 / Math.min(w, h);
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
// institutions. This scene has no link field; the sequence names seat indices only (the signal passes between people).
test(`${ID}: no shipped preset or default supplies a directed link between institutions`, async () => {
  const def = (await import('../../src/animations/courts/LAW-0223.js')).default;
  const bad = [];
  const walk = (o, path) => {
    if (Array.isArray(o)) o.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (k === 'kind') bad.push(`${path}.kind=${v}`); walk(v, `${path}.${k}`); }
  };
  for (const pr of [{name: 'default', params: def.defaultParams}, ...presetsFor(ID)]) {
    walk(pr.params, pr.name);
    (pr.params.routes ?? def.defaultParams.routes).forEach((v, i) => { if (!Number.isInteger(v)) bad.push(`${pr.name} routes[${i}] is not a seat index`); });
  }
  expect(Object.keys(def.paramsSchema.properties)).not.toContain('relationships');
  expect(bad).toEqual([]);
});
