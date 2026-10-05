// LAW-0498 — Cláusula de terminación · mechanism. Contract battery + ID-specific checks.
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// schedules, definitions, priorities (no priority or order between sections is drawn) and elements (the elements are the
// motif's own objects — contract plate, circumstances panel and card, clause panel and section cards, connector bracket
// — whose texts are editable through contract, panels, circumstance, stateLabels and clauses); clauses = the sections of
// the termination clause. caseState, relationships, relationLabels, focusElement and traversalOrder are exposed. No
// stress field is capped.
// acceptanceCheck (brief): every connector ends on its element (the part relations between the plate's foot and each
// panel's top edge; the communication link between the card's port and the bracket's knob), the order does not change on
// seek (seekHistory, determinism) and a relation is never drawn as causality (no arrowhead anywhere; plain lines; the
// link labelled "Communication (as supplied)"). The link is drawn only when the case is supplied as provided for; the
// bracket moves only once the marker has reached the knob. With "not described" no link, the marker stops at the card,
// the bracket stays open (neutral).
// Legal content (very high risk: termination): noConditionRuleWords (termination list, EN and ES, rendered and presets),
// conceptNeutral; provided for and not described drawn alike (● and ◆ of the same area, colour and stroke).
// Windows (LAW-0498.js W): explode 0.04–0.16 · relations 0.20–0.30 (labels 0.28–0.34) · communication link 0.32–0.42 ·
// marker 0.46–0.72 (focus 0.45–0.52 up, 0.72–0.77 down; the bracket slides for up to 0.06 once the marker reaches the
// knob, done by 0.765) · gather 0.77–0.86 · final 0.80–0.85 · key 0.84–0.89.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, seekHistory, fill, esDefaults, noConditionRuleWords, conceptNeutral, TERM_BANNED, CONFIG_WORDS, noOneWordLines, noLoneLetterSplit, noTornNumberUnit, esAportadoAgrees, docSize} from './ct05-rendered.js';

const ID = 'LAW-0498';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const RATIOS = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];

contractSuite(ID, {
  continuity: ['tracer', 'colE', 'colT', 'plate'],
  semantic: [
    {at: 0, fn: "s.exploded === 0 && s.linkProgress === 0 && s.relations.length === 0 && s.bracket === 'open'", label: 'the contract assembled: plate on the panels, nothing related yet; the bracket open'},
    {at: 0.18, fn: 's.exploded === 1', label: 'separate: the parts apart'},
    {at: 0.38, fn: "s.relations.includes('part') && s.linkProgress > 0", label: 'relate: the part relations drawn, the communication link drawing on'},
    {at: 0.6, fn: "s.focusScale === 1 && s.focus === 'circumstance'", label: 'trace: the focus element enlarged while the marker runs'},
    {at: 0.77, fn: "s.bracket === 'closed' && s.markerPastKnob !== false", label: 'the bracket shut after the marker reached the knob (provided, as supplied)'},
    {at: 1, fn: "s.keyShown === 1 && s.finalShown === 1 && s.exploded < 1 && s.exploded > 0.5 && s.linkProgress === 1 && s.bracket === 'closed' && s.layoutOk", label: 'gather: the parts close in part; everything visible; final state and key'},
    {at: 0.3, fn: "s.keyShown === 0 && s.focusScale === 0 && s.bracket === 'open'", label: 'seeking back restores the earlier state'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.caseState === 'undescribed' && s.bracket === 'open' && !s.linkDrawn && s.linkProgress === 0 && JSON.stringify(s.stages) === JSON.stringify(['circumstance'])", label: 'alternative: not described — no link drawn, the marker stays at the card, the bracket stays open'},
    {at: 0.6, params: {caseState: 'undescribed'}, fn: "!s.linkDrawn && s.bracket === 'open' && JSON.stringify(s.stages) === JSON.stringify(['contract','circumstance'])", label: 'not described (default stages): the marker runs contract → card only'},
    {at: 0.6, params: P('contrast-or-alternative'), fn: "s.focus === 'section' && s.focusScale === 1", label: 'alternative: the section panel in focus'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.linkProgress === 1 && s.exploded > 0.5 && s.bracket === 'closed'", label: 'labels hidden: the same mechanism'},
  ],
});

ratioChecks(ID, 'layout fits; the bracket moves only after the marker reached the knob', [
  {at: [1], fn: 's.layoutOk', label: 'layout fits'},
  {at: times(0.4, 1, 0.01), fn: "s.bracket === 'open' || s.markerPastKnob !== false", label: 'the bracket moves only once the marker has reached the knob'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title, p.panels.circumstance, p.panels.section, p.circumstance.label, p.stateLabels[p.caseState], ...p.clauses, p.relationLabels.part, ...(p.caseState === 'provided' && p.relationships.includes('config') ? [p.relationLabels.config] : [])]",
  content: "return [p.circumstance.label, p.stateLabels[p.caseState], ...p.clauses, p.relationLabels.part, ...(p.caseState === 'provided' && p.relationships.includes('config') ? [p.relationLabels.config] : [])]",
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

test(`${ID}: no preset supplies termination-rule or conclusion wording (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) {
    expect(JSON.stringify(pr.params).match(TERM_BANNED), pr.name).toBeNull();
    expect(JSON.stringify(pr.params).match(CONFIG_WORDS), pr.name).toBeNull();
  }
});

// Rendered (every preset × ratio × labels all / none, while the marker runs and at the hold): the communication link joins
// the circumstance card's right edge and the bracket's knob (both halves meet; the ends on their elements); each part relation
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
      if (q('link') && parseFloat(q('link').getAttribute('opacity') ?? '1') > 0.5) {
        n++;
        const a = q('link-a'), b = q('link-b');
        const a0 = pt(a, 0), b0 = pt(b, 0), a1 = pt(a, a.getTotalLength()), b1 = pt(b, b.getTotalLength());
        const card = R(q('ev-in-sheet')), knob = R(q('br-art-knob'));
        if (Math.abs(a0.x - card.right) * k > 4 || a0.y < card.top || a0.y > card.bottom) fails.push(`${tag}: the link does not start on the circumstance card's edge`);
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
        const panel = R(q(s === 'e' ? 'circumstance-panel' : 'section-panel'));
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

// Provided and undescribed at equal weight (rendered, every ratio): the ● and ◆ glyphs have the same area (± 8 %), fill and
// stroke, and the circumstance card the same size; the glyph stays ≥ 4 px clear of the card print.
test(`${ID}: provided and undescribed drawn alike; the glyph clear of the print (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async ([id, ratios]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    for (const [ratio, w, h] of ratios) for (const loc of ['en', 'es']) {
      const got = {};
      for (const st of ['provided', 'undescribed']) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {caseState: st, locale: loc}});
        await x.ready;
        x.seek(x.durationMs);
        const svg = x.element;
        const k = 1080 / Math.min(w, h) * (w / svg.getBoundingClientRect().width);
        const gl = svg.querySelector(`[data-node="ev-in-st-${st}"]`).querySelector('circle, path');
        const b = gl.getBoundingClientRect();
        got[st] = {area: st === 'provided' ? Math.PI * (b.width / 2) ** 2 : b.width * b.height / 2, fill: gl.getAttribute('fill'), sw: gl.getAttribute('stroke-width'), card: svg.querySelector('[data-node="ev-in-sheet"]').getBoundingClientRect()};
        for (const t of svg.querySelectorAll('[data-node="ev-in"] text')) {
          const tb = t.getBoundingClientRect();
          if (tb.bottom < b.top || tb.top > b.bottom) continue;
          const gap = Math.max(tb.left - b.right, b.left - tb.right) * k;
          if (gap < 4) fails.push(`${ratio} ${loc} ${st}: glyph ${gap.toFixed(1)} px from the print`);
        }
        x.destroy();
        el.remove();
      }
      const a = got.provided, b = got.undescribed;
      if (Math.abs(a.area - b.area) / a.area > 0.08) fails.push(`${ratio} ${loc}: ● ${a.area.toFixed(0)} vs ◆ ${b.area.toFixed(0)} px²`);
      if (a.fill !== b.fill || a.sw !== b.sw) fails.push(`${ratio} ${loc}: glyph fill / stroke differ`);
      if (Math.abs(a.card.width - b.card.width) > 1 || Math.abs(a.card.height - b.card.height) > 1) fails.push(`${ratio} ${loc}: the circumstance card changes size with the state`);
    }
    return fails;
  }, [ID, RATIOS]);
  expect(out).toEqual([]);
});

noOneWordLines(ID);
noLoneLetterSplit(ID);
noTornNumberUnit(ID);
esAportadoAgrees(ID);

// Long unbroken tokens (fix2-contract-terms-05, reviewer request 2026-10-05): a 33-, 42- or 55-character word in the circumstance
// label, an clause, a state label or a party name — over the default content and over the long-labels-stress content
// — renders a full scene at 16:9, 9:16 and 1:1 (never the empty group of `no-layout-fits`): the kit breaks a word (after
// its own hyphens, else mid-word with a hyphen) only in a second layout pass, when no whole-word layout exists; all text
// stays inside the frame.
test(`${ID}: long unbroken tokens (33/42/55 chars) render a full scene at every ratio (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const stress = P('long-labels-stress');
  const out = await page.evaluate(async ([id, stress]) => {
    const def = await window.__lib.load(id);
    const d = def.defaultParams;
    const TOK = ['Vertragserfuellungsbedingungenxyz', 'Gewaehrleistungsverpflichtungsvereinbarung', 'Gewaehrleistungsverpflichtungsvereinbarungsklauselnabcd'];
    const fails = [];
    let n = 0, slow = 0, broken = 0;
    for (const tok of TOK) for (const [bn, base] of [['default', {}], ['stress', stress]]) for (const field of ['circumstance', 'clause', 'state', 'name']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const p = structuredClone(base);
      if (field === 'circumstance') p.circumstance = {label: `${tok} 1`};
      if (field === 'clause') p.clauses = [`${tok} 1`, ...(p.clauses ?? d.clauses).slice(1)];
      if (field === 'state') p.stateLabels = {provided: tok, undescribed: (p.stateLabels ?? d.stateLabels).undescribed};
      if (field === 'name') p.parties = [{...(p.parties ?? d.parties)[0], name: tok}, (p.parties ?? d.parties)[1]];
      const tag = `${tok.length} ${bn} ${field} ${ratio}`;
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const t0 = performance.now();
      const x = def.create(el, {width: w, height: h, params: p});
      await x.ready;
      slow = Math.max(slow, performance.now() - t0);
      const svg = x.element;
      const sb = svg.getBoundingClientRect();
      for (const u of [0.6, 1]) {
        x.seek(u * x.durationMs);
        const s = x.getState({bounds: false}).semantic;
        n++;
        if (!s.layoutOk) fails.push(`${tag} u${u}: layoutOk ${s.layoutOk} (${s.why})`);
        if (svg.querySelectorAll('path').length < 30 || !svg.querySelector('[data-node$="board-sheet"], [data-node="plate-sheet"]') || !svg.querySelector('[data-node$="ev-in-sheet"]')) fails.push(`${tag} u${u}: no full scene`);
        const vis = e => { let v = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null) v *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return v; };
        for (const t of svg.querySelectorAll('text')) {
          const b = t.getBoundingClientRect();
          if (!b.width || vis(t) < 0.5) continue;
          if (b.left < sb.left - 1 || b.right > sb.right + 1 || b.top < sb.top - 1 || b.bottom > sb.bottom + 1) fails.push(`${tag} u${u}: text outside the frame "${t.textContent.slice(0, 20)}"`);
          if (u === 1) for (const ln of t.querySelectorAll('tspan').length ? t.querySelectorAll('tspan') : [t]) if (/\p{L}-$/u.test(ln.textContent.trim())) broken++;
        }
      }
      x.destroy();
      el.remove();
    }
    return {fails, n, slow: Math.round(slow), broken};
  }, [ID, stress]);
  console.log(`${ID} long tokens: ${out.n} frames, slowest create ${out.slow} ms, ${out.broken} broken lines seen`);
  expect(out.n).toBe(144);
  expect(out.fails).toEqual([]);
});

// "Not described" draws no connection (rendered, every ratio × labels all / none, u 0.3 … 1): the link and its label stay
// invisible, the bracket stays open and the marker never comes to the section panel.
test(`${ID}: with "not described" no connection is drawn and the marker never reaches the section (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async ([id, ratios]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let n = 0;
    for (const [ratio, w, h] of ratios) for (const tv of ['all', 'none']) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {caseState: 'undescribed', textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      for (let u = 0.3; u <= 1.0001; u += 0.02) {
        x.seek(u * x.durationMs);
        const s = x.getState({bounds: false}).semantic;
        n++;
        const op = nm => { const e = svg.querySelector(`[data-node="${nm}"]`); return e ? parseFloat(e.getAttribute('opacity') ?? '1') : 0; };
        if (op('link') > 0 || op('lab-config') > 0) fails.push(`${ratio} ${tv} u${u.toFixed(2)}: link or its label visible`);
        if (s.bracket !== 'open') fails.push(`${ratio} ${tv} u${u.toFixed(2)}: the bracket moves`);
        const panel = svg.querySelector('[data-node="section-panel"]').getBoundingClientRect();
        const tr = svg.querySelector('[data-node="tracer"]');
        if (parseFloat(tr.getAttribute('opacity') ?? '1') > 0) {
          const b = tr.getBoundingClientRect();
          if (b.left + b.width / 2 > panel.left - 4) fails.push(`${ratio} ${tv} u${u.toFixed(2)}: the marker reaches the section panel`);
        }
      }
      x.destroy();
      el.remove();
    }
    return {fails: [...new Set(fails)], n};
  }, [ID, RATIOS]);
  expect(out.n).toBeGreaterThan(100);
  expect(out.fails.slice(0, 20)).toEqual([]);
});
