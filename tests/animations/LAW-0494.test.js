// LAW-0494 — Condición de activación · mechanism. Contract battery + ID-specific checks.
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// clauses (the event card and the obligation cards stand for the clauses), schedules, definitions, priorities (no
// priority or order between obligations is drawn) and elements (the elements are the motif's own objects — contract
// plate, event panel and card, tranche panel and cards, bracket — whose texts are editable through contract, panels,
// event, stateLabels and obligations). eventState, relationships, relationLabels, focusElement and traversalOrder are
// exposed. No stress field is capped.
// acceptanceCheck (brief): every connector ends on its element (the part relations between the plate's foot and each
// panel's top edge; the configured link between the event card's port and the bracket's knob), the order does not change
// on seek (seekHistory, determinism) and a relation is never drawn as causality (no arrowhead anywhere; plain lines; the
// configured link only "as supplied"). The bracket moves only once the marker has reached the knob, and only with the
// supplied state "produced" — it marks the tranche, nothing else.
// Legal content (very high risk: conditions): noConditionRuleWords (EN and ES, rendered and presets), conceptNeutral;
// produced and pending drawn alike (● and ◆ of the same area, colour and stroke).
// Windows (LAW-0494.js W): explode 0.04–0.16 · relations 0.20–0.30 (labels 0.28–0.34) · configured link 0.32–0.42 ·
// marker 0.46–0.72 (focus 0.45–0.52 up, 0.72–0.77 down; the bracket slides for up to 0.06 once the marker reaches the knob, done by 0.765) ·
// gather 0.77–0.86 · final 0.80–0.85 · key 0.84–0.89.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, seekHistory, fill, esDefaults, noConditionRuleWords, conceptNeutral, TERM_BANNED, CONFIG_WORDS, noOneWordLines, noLoneLetterSplit, noTornNumberUnit, esAportadoAgrees, docSize} from './ct04-rendered.js';

const ID = 'LAW-0494';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const RATIOS = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];

contractSuite(ID, {
  continuity: ['tracer', 'colE', 'colT', 'plate'],
  semantic: [
    {at: 0, fn: "s.exploded === 0 && s.linkProgress === 0 && s.relations.length === 0 && s.bracket === 'open'", label: 'the contract assembled: plate on the panels, nothing related yet; the bracket open'},
    {at: 0.18, fn: 's.exploded === 1', label: 'separate: the parts apart'},
    {at: 0.38, fn: "s.relations.includes('part') && s.linkProgress > 0", label: 'relate: the part relations drawn, the configured link drawing on'},
    {at: 0.6, fn: "s.focusScale === 1 && s.focus === 'event'", label: 'trace: the focus element enlarged while the marker runs'},
    {at: 0.77, fn: "s.bracket === 'closed' && s.markerPastKnob !== false", label: 'the bracket shut after the marker reached the knob (produced, as supplied)'},
    {at: 1, fn: "s.keyShown === 1 && s.finalShown === 1 && s.exploded < 1 && s.exploded > 0.5 && s.linkProgress === 1 && s.bracket === 'closed' && s.layoutOk", label: 'gather: the parts close in part; everything visible; final state and key'},
    {at: 0.3, fn: "s.keyShown === 0 && s.focusScale === 0 && s.bracket === 'open'", label: 'seeking back restores the earlier state'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.eventState === 'pending' && s.bracket === 'open' && JSON.stringify(s.stages) === JSON.stringify(['event','link','tranche'])", label: 'alternative: pending — the bracket stays open; the marker from the event'},
    {at: 0.6, params: P('contrast-or-alternative'), fn: "s.focus === 'tranche' && s.focusScale === 1", label: 'alternative: the tranche panel in focus'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.linkProgress === 1 && s.exploded > 0.5 && s.bracket === 'closed'", label: 'labels hidden: the same mechanism'},
  ],
});

ratioChecks(ID, 'layout fits; the bracket moves only after the marker reached the knob', [
  {at: [1], fn: 's.layoutOk', label: 'layout fits'},
  {at: times(0.4, 1, 0.01), fn: "s.bracket === 'open' || s.markerPastKnob !== false", label: 'the bracket moves only once the marker has reached the knob'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title, p.panels.event, p.panels.tranche, p.event.label, p.stateLabels[p.eventState], ...p.obligations, p.relationLabels.part, p.relationLabels.config]",
  content: "return [p.event.label, p.stateLabels[p.eventState], ...p.obligations, p.relationLabels.part, p.relationLabels.config]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
seekHistory(ID);
fill(ID, [0.3, 1], {short: 0.5});
esDefaults(ID);
noConditionRuleWords(ID);
conceptNeutral(ID);
docSize(ID, {cards: '^(ev-in|obl\\d-in)$', times: [0.3, 1], floor: 70});

test(`${ID}: no preset supplies rule, conclusion or condition wording (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) {
    expect(JSON.stringify(pr.params).match(TERM_BANNED), pr.name).toBeNull();
    expect(JSON.stringify(pr.params).match(CONFIG_WORDS), pr.name).toBeNull();
  }
});

// Rendered (every preset × ratio × labels all / none, while the marker runs and at the hold): the configured link joins
// the event card's right edge and the bracket's knob (both halves meet; the ends on their elements); each part relation
// ends on the plate's foot and on its panel's top edge; no line carries an arrowhead or a dash; the link's label is on the
// link or joined to it by a leader.
test(`${ID}: connectors land on their elements, plain; the link's label on the link (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let n = 0;
    for (const pr of presets) for (const [ratio, w, h] of ratios) for (const tv of ['all', 'none']) for (const u of [0.6, 1]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      x.seek(u * x.durationMs);
      const svg = x.element;
      const k = 1080 / Math.min(w, h) * (w / svg.getBoundingClientRect().width);
      const q = nm => svg.querySelector(`[data-node="${nm}"]`);
      const R = e => e.getBoundingClientRect();
      const pt = (pth, at) => { const m = pth.getScreenCTM(); const p0 = pth.getPointAtLength(at); return new DOMPoint(p0.x, p0.y).matrixTransform(m); };
      const tag = `${pr.name} ${ratio} ${tv} u${u}`;
      if (q('link')) {
        n++;
        const a = q('link-a'), b = q('link-b');
        const a0 = pt(a, 0), b0 = pt(b, 0), a1 = pt(a, a.getTotalLength()), b1 = pt(b, b.getTotalLength());
        const card = R(q('ev-in-sheet')), knob = R(q('br-art-knob'));
        if (Math.abs(a0.x - card.right) * k > 4 || a0.y < card.top || a0.y > card.bottom) fails.push(`${tag}: the link does not start on the event card's edge`);
        if (Math.hypot(b0.x - (knob.left + knob.width / 2), b0.y - (knob.top + knob.height / 2)) * k > 3) fails.push(`${tag}: the link does not end on the knob`);
        if (Math.hypot(a1.x - b1.x, a1.y - b1.y) * k > 2) fails.push(`${tag}: the link's halves do not meet`);
        for (const e of [a, b]) if (e.getAttribute('marker-end') || e.getAttribute('stroke-dasharray')) fails.push(`${tag}: link arrow or dash`);
        const lab = q('lab-config');
        if (lab) {
          const L = R(lab.querySelector('path:last-of-type') ?? lab);
          const onLink = a1.y >= L.top - 2 && a1.y <= L.bottom + 2;
          const lead = lab.querySelector('path[stroke-linecap="round"]');
          let led = false;
          if (lead && lead !== lab.querySelector('path')) led = true;
          if (lead) { const t = pt(lead, lead.getTotalLength()); if (Math.abs(t.y - a1.y) * k < 30) led = true; }
          if (!onLink && !led) fails.push(`${tag}: the link's label is neither on the link nor led to it`);
        }
      }
      for (const s of ['e', 't']) {
        const ln = q(`rel-part-${s}`);
        if (!ln) continue;
        if (ln.getAttribute('marker-end') || ln.getAttribute('stroke-dasharray')) fails.push(`${tag}: relation arrow or dash`);
        const panel = R(q(s === 'e' ? 'event-panel' : 'tranche-panel'));
        const p2 = new DOMPoint(parseFloat(ln.getAttribute('x2')), parseFloat(ln.getAttribute('y2'))).matrixTransform(ln.getScreenCTM());
        if (Math.abs(p2.y - panel.top) * k > 4 || p2.x < panel.left - 2 || p2.x > panel.right + 2) fails.push(`${tag}: rel-part-${s} does not land on its panel's top edge`);
        const plate = R(q('plate-sheet'));
        const p1 = new DOMPoint(parseFloat(ln.getAttribute('x1')), parseFloat(ln.getAttribute('y1'))).matrixTransform(ln.getScreenCTM());
        if (Math.abs(p1.y - plate.bottom) * k > 4) fails.push(`${tag}: rel-part-${s} does not start on the plate's foot`);
      }
      x.destroy();
      el.remove();
    }
    return {fails: [...new Set(fails)], n};
  }, [ID, presets, RATIOS]);
  expect(out.n).toBeGreaterThan(10);
  expect(out.fails.slice(0, 20)).toEqual([]);
});

// Produced and pending at equal weight (rendered, every ratio): the ● and ◆ glyphs have the same area (± 8 %), fill and
// stroke, and the event card the same size; the glyph stays ≥ 4 px clear of the card print.
test(`${ID}: produced and pending drawn alike; the glyph clear of the print (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async ([id, ratios]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    for (const [ratio, w, h] of ratios) for (const loc of ['en', 'es']) {
      const got = {};
      for (const st of ['produced', 'pending']) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {eventState: st, locale: loc}});
        await x.ready;
        x.seek(x.durationMs);
        const svg = x.element;
        const k = 1080 / Math.min(w, h) * (w / svg.getBoundingClientRect().width);
        const gl = svg.querySelector(`[data-node="ev-in-st-${st}"]`).querySelector('circle, path');
        const b = gl.getBoundingClientRect();
        got[st] = {area: st === 'produced' ? Math.PI * (b.width / 2) ** 2 : b.width * b.height / 2, fill: gl.getAttribute('fill'), sw: gl.getAttribute('stroke-width'), card: svg.querySelector('[data-node="ev-in-sheet"]').getBoundingClientRect()};
        for (const t of svg.querySelectorAll('[data-node="ev-in"] text')) {
          const tb = t.getBoundingClientRect();
          if (tb.bottom < b.top || tb.top > b.bottom) continue;
          const gap = Math.max(tb.left - b.right, b.left - tb.right) * k;
          if (gap < 4) fails.push(`${ratio} ${loc} ${st}: glyph ${gap.toFixed(1)} px from the print`);
        }
        x.destroy();
        el.remove();
      }
      const a = got.produced, b = got.pending;
      if (Math.abs(a.area - b.area) / a.area > 0.08) fails.push(`${ratio} ${loc}: ● ${a.area.toFixed(0)} vs ◆ ${b.area.toFixed(0)} px²`);
      if (a.fill !== b.fill || a.sw !== b.sw) fails.push(`${ratio} ${loc}: glyph fill / stroke differ`);
      if (Math.abs(a.card.width - b.card.width) > 1 || Math.abs(a.card.height - b.card.height) > 1) fails.push(`${ratio} ${loc}: the event card changes size with the state`);
    }
    return fails;
  }, [ID, RATIOS]);
  expect(out).toEqual([]);
});

noOneWordLines(ID);
noLoneLetterSplit(ID);
noTornNumberUnit(ID);
esAportadoAgrees(ID);
