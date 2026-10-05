// LAW-0221 — Organización de turnos · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (the token moves only under a hand or gliding between two hands —
// no jump), anchoring (hands on the token, people on their seats, labels beside their seats) and the transformation
// (the signal passes along the supplied sequence; the lamp of the holder is lit) recognisable with the labels hidden.
// Timing (u): rest 0–0.15 (nothing moves); the passes run inside 0.16–0.72 (one hop per step of the sequence as
// configured); notes and the state tag fade in 0.75–0.82; everything is still from u ≈ 0.82.
// Legal: participants, parties (● / ◆ badges of equal weight) and the sequence are as supplied ("sequence as configured
// (illustrative)"); "pending" only means waiting; no speaking order, time per turn or consequence; no dashes, no
// arrowheads in the plan; the key says "as supplied · no conclusion drawn".
// Coordinator decision (standing stress rule, 2026-09-26, AUTHORING item 20; reason corrected in courts-06 review 1): the
// long-labels-stress count is capped to the baseline's four participants (texts stay near-maximum). With six near-maximum
// participants at 1:1 every chip is placed at 16.9 px, but the people render at 58.3 px, under the 60 px floor.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0221';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['token'],
  attach: Array.from({length: 4}, (_, i) => ({from: 0, to: 1, a: `p${i}`, b: `seat${i}`, tol: 0.5})),
  semantic: [
    {at: 0, fn: "s.holder === 'Participant B' && s.lit === 1 && s.lamps[1] === 1 && s.phase === 'rest' && s.hop === -1", label: 'rest: the first person in the sequence holds the signal, their lamp alone is lit'},
    {at: 0.145, fn: "s.hop === -1 && s.holder === 'Participant B'", label: 'nothing moves during the rest beat'},
    ...[0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7].map(at => ({at, fn: 's.causeFirst', label: `cause before effect: a lamp is lit only with the token in hand (u=${at})`})),
    {at: 0.3, fn: "s.hop === 0 && s.phase !== 'rest' || s.holder === 'Participant C'", label: 'the first pass is under way'},
    {at: 0.74, fn: "s.holder === 'Participant D' && JSON.stringify(s.holdersSoFar) === JSON.stringify(['Participant B', 'Participant C', 'Participant D'])", label: 'the main action is complete by u 0.74, in the supplied order'},
    {at: 1, fn: "s.holder === 'Participant D' && s.lit === 1 && s.lamps[3] === 1 && s.finalState === 'turn-active' && s.allReached", label: 'hold: the last person in the sequence holds the signal (supplied final state)'},
    {at: 1, params: {finalState: 'all-pending'}, fn: 's.holder === null && s.lit === 0 && s.tokenInTray', label: 'supplied state: the signal is back in the tray and every turn is pending'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.holder !== 'Participant D'", label: 'actionProgress freezes the passing part-way'},
    {at: 1, params: {routes: [3, 0]}, fn: "JSON.stringify(s.sequence) === JSON.stringify(['Participant D', 'Participant A']) && s.holder === 'Participant A' && s.hopsTotal === 1", label: 'the supplied sequence decides who passes to whom'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: 's.hop >= 0 && s.causeFirst', label: 'labels hidden: the same passing happens'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.holder === 'Participant D' && s.lit === 1", label: 'labels hidden: the same final state'},
    {at: 1, fn: 's.problems.length === 0 && s.chips === 4', label: 'every chip placed beside its seat (no fallback layout)'},
    ...[0.1, 0.4, 0.7, 1].map(at => ({at, fn: 's.allReached', label: `every hand target within reach (u=${at})`})),
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.courts.building, p.courts.room, ...p.seats.map(s => s.label), p.labels.active, p.labels.pending, p.labels.sequence, p.labels.circle, p.labels.diamond, p.labels.key, p.actorLabels.participant, p.objectLabels.signal, ...p.annotations.map(a => a.text)];",
  content: 'return [p.courts.building, p.courts.room, ...p.seats.map(s => s.label), p.labels.active, p.labels.pending];',
  captions: 'return [p.actorLabels.participant, p.objectLabels.signal, p.labels.circle, p.labels.diamond];',
});

// ---------------------------------------------------------------------------------------------
// Rendered checks (every preset × ratio × labels shown/hidden). Distances in px at 1080p.
const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const EFF = "const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };";
const HEADS = "const heads = [...svg.querySelectorAll('[data-node$=\"-head\"]')].filter(e => /^p\\d+-head$/.test(e.getAttribute('data-node'))).map(bx);";
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

ratioChecks(ID, 'cards off faces, labels own their seats, people large, equal parties, token in hand, plan fills the frame', [
  {at: times(0, 1, 0.05), dom: NO_CARD_ON_FACE, label: 'rendered: no card, chip or note covers a head'},
  {at: [0, 0.5, 1], tv: ['all'], dom: LABEL_OWNS_SEAT, label: 'rendered: each chip within 40 px of its own person, its leader ends on that person and crosses no text, chip or head'},
  {at: [0, 0.3, 0.6, 0.9, 1], tv: ['all'], dom: CHIPS_OFF_MARKS, label: 'rendered: no chip lies over a lamp, the token, a note ring, a party badge, a plant or the tray'},
  {at: [0, 0.3, 0.6, 1], dom: PEOPLE_SIZE, label: 'rendered: people >= 60 px across and heads >= 26 px (1080p) at rest, during the passes and at the hold'},
  {at: [1], dom: FILL, label: 'rendered: the plan, building and panel fill the caption-safe box'},
  {at: [0, 0.5, 1], dom: IN_FRAME, label: 'rendered: nothing leaves the frame'},
  {at: times(0, 1, 0.1), dom: OPAQUE, label: 'rendered: people are always whole and opaque'},
  {at: [0.5, 1], dom: EQUAL_PARTIES, label: 'rendered: both parties have equal weight (same badge size); nothing in the plan is dashed'},
  {at: [0, 0.5, 1], dom: NO_MARKERS, label: 'rendered: no arrow markers anywhere'},
  {at: [0, 0.1, 0.74, 0.9, 1], presets: ['baseline-illustrative', 'baseline-es', 'long-labels-stress'], dom: TOKEN_IN_HAND, label: 'rendered: at rest and at the hold the token lies under the holder’s hand'},
  {at: times(0.16, 0.72, 0.02), fn: 's.causeFirst && s.allReached', label: 'cause before effect and reachable hands through every pass'},
  {at: [0.1, 0.5, 1], tv: ['all'], presets: ['baseline-illustrative', 'baseline-es'], dom: TEXT_195, label: 'rendered: baseline and baseline-es: every visible text >= 19.5 px in every ratio'},
  {at: [1], fn: 's.problems.length === 0', label: 'no fallback layout'},
]);

// The token never jumps (60 fps, 16:9 and 9:16, every preset): between consecutive frames it moves at most 60 design
// units, and a change of holder happens only with the token at the receiver's place.
test(`${ID}: the token never jumps and changes holder only on arrival`, async ({page}) => {
  test.setTimeout(180000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, ps]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of ps) for (const [w, h] of [[1920, 1080], [1080, 1920]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      const frames = Math.ceil(x.durationMs / 1000 * 60);
      let prev = null;
      for (let f = 0; f <= frames; f++) {
        x.renderFrame(f, {fps: 60});
        const s = x.getState({bounds: false}).semantic;
        if (prev) {
          const d = Math.hypot(s.token.x - prev.token.x, s.token.y - prev.token.y);
          if (d > 60) out.push(`${pr.name} ${w}x${h} f${f}: token jumped ${d.toFixed(0)}`);
          if (prev.holder && s.holder && prev.holder !== s.holder) out.push(`${pr.name} ${w}x${h} f${f}: holder changed without a pass`);
        }
        prev = s;
      }
      x.destroy(); el.remove();
    }
    return out.slice(0, 20);
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
  const def = (await import('../../src/animations/courts/LAW-0221.js')).default;
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
