// LAW-0455 — Vencimiento de propuesta · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (where the response stands relative to
// the supplied milestone: before it in A, after it in B) — and it changes the objects, the relations and the sequence,
// not only text: the clock's hand reaches its mark after the response has landed in A and before it leaves in B, and
// the table's rows differ — and no legal consequence is invented to complete the contrast (no winner, no outcome; no
// deadline / expiry / validity wording: noDeadlineWords).
// Composition (LAW-0455.js): two identical stages (side by side or stacked, each with its clock on B's rack) over one
// comparison table (one row per event, the milestone included; one column per scenario) and the footer notes.
// Windows: headers 0.24–0.30 (CHANGE = 0.24) · table (with its frame) 0.24–0.30 · clocks from 0.32 · events from 0.44 at the same pitch
// in both scenes · ring 0.79–0.84 · guide 0.81–0.86 · key 0.83–0.88.
// Standing coordinator rule (item 20): the long-labels-stress response time labels in both scenarios (still longer than baseline), the changed fact,
// the guide and the neutral note are capped (per-field reason with rendered numbers in the preset's description; pre-cap
// values in LAW-0455.presets.precap.json).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, cardsApart, noDeadlineWords} from './cf04-rendered.js';

const ID = 'LAW-0455';
const CHANGE = 0.24;
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['cardPA', 'cardRA', 'cardPB', 'cardRB', 'handAA', 'handBA', 'handAB', 'handBB'],
  semantic: [
    {at: 0, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.headers === 0 && s.a.clock === -120', label: 'base: two identical stages, clocks at rest, no scenario label, no table yet'},
    {at: 0.23, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'still identical just before the change'},
    {at: 0.42, fn: "s.headers === 1 && s.a.relation === 'before' && s.b.relation === 'after' && s.lookA.row === 1", label: 'change: A supplies the response before the milestone, B after it'},
    {at: 0.5, fn: "s.a.whereP === 'B' && s.b.whereP === 'B' && s.a.whereR === 'A' && s.b.whereR === 'A'", label: 'parallel: the proposal has arrived in both stages; both responses still in B\'s rack'},
    {at: 0.56, fn: "s.a.whereR === 'route' && s.a.clock < 0 && s.b.whereR === 'A' && s.b.clock >= 0", label: 'A: the response travels before the hand reaches the mark; B: the hand has reached the mark before the response leaves'},
    {at: 0.75, fn: "s.a.whereR === 'B' && s.a.atMark && s.b.whereR === 'B' && s.b.clock === 60", label: 'A: the response landed, then the hand reached the mark; B: the response landed after the hand passed the mark'},
    {at: 1, fn: "s.guide === 1 && s.allReached && s.layoutOk && JSON.stringify(s.a.order) === JSON.stringify(['proposal-received','response-sent','response-received','milestone']) && JSON.stringify(s.b.order) === JSON.stringify(['proposal-received','milestone','response-sent','response-received'])", label: 'guide: both sequences as supplied; the guide is shown; hands reach'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.a.relation === 'before' && s.b.relation === 'after' && s.a.order[3] === 'milestone' && s.b.order[1] === 'milestone'", label: 'alternative: the same reply, the milestone supplied at another time'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.a.whereR === 'B' && s.b.whereR === 'B' && s.a.atMark && s.b.clock === 60 && s.guide === 1", label: 'labels hidden: the same contrast plays'},
  ],
});

identicalBeforeChange(ID, CHANGE);

ratioChecks(ID, 'paired layout, reach and equal stages', [
  {at: [1], fn: 's.layoutOk && s.sameGeometry', label: 'every block fits; both stages share one geometry (the clocks included)'},
  {at: times(0, 1, 0.05), fn: 's.allReached', label: 'every hand reaches its target'},
  {at: [1], fn: 's.flightGap >= 0', label: 'the two cards never meet'},
]);

suppliedTextSuite(ID, {
  fields: `return [p.offer.reference, p.offer.title, ...p.terms.map(t => t.label + ': ' + t.value), p.responses[0].reference, p.responses[0].text,
    ...p.scenarioA.sequence.map(e => e.time), ...p.scenarioB.sequence.map(e => e.time), ...p.parties.map(q => q.name),
    p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral].filter(Boolean)`,
  content: `return [p.offer.title, ...p.terms.map(t => t.label + ': ' + t.value), p.responses[0].text, ...p.scenarioA.sequence.map(e => e.time), ...p.scenarioB.sequence.map(e => e.time), p.changedFact]`,
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión', 'Milestone as supplied (illustrative)', 'Hito según lo aportado (ilustrativo)']",
});

textFloor(ID);
noTextOverlap(ID);
noTextOverProps(ID, ['[data-node="a-card-p"]', '[data-node="a-card-r"]', '[data-node="b-card-p"]', '[data-node="b-card-r"]', '[data-node="a-A-head"]', '[data-node="a-B-head"]', '[data-node="b-A-head"]', '[data-node="b-B-head"]', '[data-node="a-clock"]', '[data-node="b-clock"]']);
seekHistory(ID);
// (coordinator ruling, LAW-0455 re-review: the fill proxy is > 0.5 on the shorter axis — this item's rest frame shows
// the scenes only, without an empty table frame; 0.5 is used here instead of this builder's own 0.55)
fill(ID, [0.05, 1], {short: 0.5});
headFloor(ID, {count: 4});
esDefaults(ID);
cardsApart(ID, [['a-card-p', 'a-card-r'], ['b-card-p', 'b-card-r'], ['a-card-p', 'a-clock'], ['a-card-r', 'a-clock'], ['b-card-p', 'b-clock'], ['b-card-r', 'b-clock']]);
noDeadlineWords(ID);

// Rendered fill (labels key / none as well as all): from the change to the hold the stages, the comparison table and
// their trays cover the caption-safe box — at least 80 % of a 24 × 24 grid of its cells is under a visible element
// box (the LAW-0448 round-4 fill pattern; this builder's own threshold).
test(`${ID}: the frame stays filled from the change to the hold, labels all / key / none (rendered grid cover)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [], worst = {};
    for (const pr of presets) for (const tv of ['all', 'key', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const R = svg.getBoundingClientRect();
      const sa = x.getState({bounds: false}).params.safeArea;
      const S = {l: R.left + R.width * sa.left, t: R.top + R.height * sa.top, w: R.width * (1 - sa.left - sa.right), h: R.height * (1 - sa.top - sa.bottom) - Math.min(R.width, R.height) * 0.057};
      const vis = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentElement) { const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o >= 0.05; };
      let mn = 1;
      for (const u of [0.3, 0.5, 0.7, 0.85, 1]) {
        x.seek(u * x.durationMs);
        const bs = [...svg.querySelectorAll('[data-layer="scene"] path, [data-layer="scene"] rect, [data-layer="scene"] circle')].filter(e => !e.closest('defs') && !e.closest('clipPath') && vis(e)).map(e => e.getBoundingClientRect()).filter(q => q.width > 2 && q.height > 2);
        let cov = 0;
        const N = 24;
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
          const cx = S.l + (i + 0.5) * S.w / N, cy = S.t + (j + 0.5) * S.h / N;
          if (bs.some(q => cx >= q.left && cx <= q.right && cy >= q.top && cy <= q.bottom)) cov++;
        }
        const f = cov / (N * N);
        mn = Math.min(mn, f);
        if (f < 0.8) fails.push(`${pr.name} ${tv} ${ratio} u${u} cover ${f.toFixed(2)}`);
      }
      worst[`${pr.name} ${tv} ${ratio}`] = +mn.toFixed(2);
      x.destroy();
      el.remove();
    }
    return {fails, worst};
  }, [ID, presets]);
  console.log(JSON.stringify(out.worst));
  expect(out.fails.slice(0, 20)).toEqual([]);
});

// Rendered: no bordered panel (the stage panels, the table's frame, the notes' tray) is ever shown empty or nearly
// empty — while a panel is visible (opacity ≥ 0.05), visible content covers ≥ 15 % of its box (a 24 × 24 grid of cell
// centres under visible text / shape boxes other than the panels themselves). Every preset × ratio × labels state,
// u step 0.02.
test(`${ID}: no bordered panel is shown empty or nearly empty (rendered, content ≥ 15 % of the box)`, async ({page}) => {
  test.setTimeout(900000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [], worst = {};
    const PANELS = ['panel0', 'panel1', 'tray', 'tray2'];
    for (const pr of presets) for (const tv of ['all', 'key', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const op = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentElement) { const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return o; };
      const leaves = [...svg.querySelectorAll('[data-layer="scene"] text, [data-layer="scene"] path, [data-layer="scene"] circle, [data-layer="scene"] rect, [data-layer="scene"] line')]
        .filter(e => !e.closest('defs') && !e.closest('clipPath') && !PANELS.includes(e.getAttribute('data-node')));
      for (let s = 0; s <= 50; s++) {
        x.seek((s / 50) * x.durationMs);
        for (const n of PANELS) {
          const pn = svg.querySelector(`[data-node="${n}"]`);
          if (!pn || op(pn) < 0.05) continue;
          const B = pn.getBoundingClientRect();
          if (B.width < 4 || B.height < 4) continue;
          const bs = leaves.filter(e => op(e) >= 0.05).map(e => e.getBoundingClientRect())
            .filter(q => q.width * q.height > 0 && q.width * q.height < 0.9 * B.width * B.height && q.right > B.left && q.left < B.right && q.bottom > B.top && q.top < B.bottom);
          const N = 24;
          let cov = 0;
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
            const cx = B.left + (i + 0.5) * B.width / N, cy = B.top + (j + 0.5) * B.height / N;
            if (bs.some(q => cx >= q.left && cx <= q.right && cy >= q.top && cy <= q.bottom)) cov++;
          }
          const f = cov / (N * N);
          const key = `${pr.name} ${tv} ${ratio} ${n}`;
          worst[key] = Math.min(worst[key] ?? 1, +f.toFixed(2));
          if (f < 0.15) fails.push(`${key} u${(s / 50).toFixed(2)}: content ${f.toFixed(2)} of the box`);
        }
      }
      x.destroy();
      el.remove();
    }
    return {fails, worst};
  }, [ID, presets]);
  const w = Object.entries(out.worst).sort((a, b) => a[1] - b[1]).slice(0, 12);
  console.log(JSON.stringify(w));
  const seen = new Set();
  const uniq = out.fails.filter(f => { const k = f.replace(/ u[0-9.]+:.*/, ''); if (seen.has(k)) return false; seen.add(k); return true; });
  expect(uniq.slice(0, 25), `${out.fails.length} near-empty panel samples`).toEqual([]);
});
