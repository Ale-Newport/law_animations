// LAW-0499 — Cláusula de terminación · contrast. Contract battery + ID-specific checks.
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// schedules, definitions and priorities (no priority or order between sections is drawn); clauses = the sections of the
// termination clause. scenarioA / scenarioB (header and supplied case of each room), changedFact, sharedFacts and
// comparisonLabels are exposed. No stress field is capped.
// acceptanceCheck (brief): both scenes exist (two complete rooms, identical before the change beat — semantic look and
// rendered), exactly the indicated fact changes (the supplied case: the case row of each room's card; as the supplied
// configuration of each room, the bracket is slid shut by Party B's hand and the cord drawn only where the case is
// provided for — the geometry differs only there), and no legal consequence is invented (no termination-rule or
// conclusion wording, EN and ES; no jurisdiction; no winner, score or outcome; provided for and not described drawn
// alike; "not described" neutral: no cord, nothing concluded).
// Layouts: 16:9 rooms side by side (each ≥ 0.40 of the width) with the shared strip below; 9:16 rooms stacked with the
// strip below; 1:1 rooms stacked beside a right-hand column, or side by side in the compact arrangement.
// Windows (LAW-0499.js W): headers 0.17–0.22 · the case row appears 0.20–0.30 (ring 0.22–0.40) · Party B's hand slides
// the bracket 0.42–0.66 and the cord is drawn 0.66–0.74 (provided rooms only) · guide 0.78–0.83 · strip 0.80–0.85.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, noConditionRuleWords, conceptNeutral, TERM_BANNED, CONFIG_WORDS, noOneWordLines, noLoneLetterSplit, noTornNumberUnit, esAportadoAgrees, docSize, stagesStackedTall} from './ct05-rendered.js';

const ID = 'LAW-0499';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const RATIOS = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];

contractSuite(ID, {
  continuity: ['brA', 'brB', 'handAA', 'handAB', 'handBA', 'handBB'],
  semantic: [
    {at: 0.1, fn: "s.stateA === 'none' && s.stateB === 'none' && s.lookA === s.lookB && s.bracketA === 'open' && s.bracketB === 'open'", label: 'base: the two rooms are identical; no state shown yet'},
    {at: 0.35, fn: "s.stateA === 'provided' && s.stateB === 'undescribed'", label: 'change: provided for in room A, not described in room B'},
    {at: 0.55, fn: "s.bracketA === 'moving' && s.heldA && s.bracketB === 'open' && !s.heldB", label: 'room A: Party B slides the bracket; room B: it stays open'},
    {at: 1, fn: "s.guide === 1 && s.bracketA === 'closed' && s.cordA === 1 && s.bracketB === 'open' && s.cordB === 0 && s.allReached && s.layoutOk", label: 'guide: the case rows ringed in both rooms; the cord only in room A; nothing concluded'},
    {at: 0.65, fn: "s.cordA === 0 && s.cordB === 0", label: 'no cord before the bracket has clasped'},
    {at: 0.15, fn: "s.stateA === 'none' && s.guide === 0 && s.bracketA === 'open'", label: 'seeking back restores the base'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.stateA === 'undescribed' && s.stateB === 'provided' && s.bracketA === 'open' && s.bracketB === 'closed' && s.cordA === 0 && s.cordB === 1", label: 'alternative: the other way round'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.bracketA === 'closed' && s.bracketB === 'open'", label: 'labels hidden: the same action'},
  ],
});

identicalBeforeChange(ID, 0.17);

ratioChecks(ID, 'layout fits, reach, room share', [
  {at: times(0, 1, 0.05), fn: 's.allReached && s.armsClear', label: 'every hand reaches its target; arms clear of the faces'},
  {at: [1], fn: 's.layoutOk', label: 'layout fits'},
  {at: times(0, 0.16, 0.02), fn: 's.lookA === s.lookB', label: 'the two rooms identical before the change'},
  {at: [1], fn: 's.roomShare >= 0.4', label: 'each room ≥ 0.40 of the frame along its arrangement axis'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.changedFact.label, p.scenarioA.label, p.scenarioB.label, ...p.sharedFacts, p.circumstance.label, ...p.clauses, ...p.parties.map(q => q.name)]",
  content: "return [p.scenarioA.label, p.scenarioB.label, p.circumstance.label, ...p.clauses]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
noTextOverProps(ID, ['[data-node="a-br"]', '[data-node="b-br"]', '[data-node="a-cord-a"]', '[data-node="b-cord-a"]', '[data-node="a-cord-b"]', '[data-node="b-cord-b"]', '[data-node="a-A-head"]', '[data-node="a-B-head"]', '[data-node="b-A-head"]', '[data-node="b-B-head"]']);
seekHistory(ID);
fill(ID, [0.05, 1], {short: 0.5});
headFloor(ID, {count: 4, floors: Object.fromEntries(['default', 'baseline-illustrative', 'contrast-or-alternative', 'baseline-es'].flatMap(n => [[`${n}|1:1`, 55], [`${n}|16:9`, 60], [`${n}|9:16`, 60]]))});
esDefaults(ID);
noConditionRuleWords(ID);
conceptNeutral(ID);
// (the circumstance card — the changed object — is a real object: ≥ 85 px at 1:1 outside the stress preset, ≥ 70 px otherwise)
docSize(ID, {cards: '^[ab]-ev-in$', times: [0.35, 0.7, 1]});
docSize(ID, {cards: '^[ab]-obl\\d-in$', times: [0.35, 1], floor: 70});
stagesStackedTall(ID, {panels: ['a-frame', 'b-frame']});

test(`${ID}: no preset supplies termination-rule or conclusion wording (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) {
    expect(JSON.stringify(pr.params).match(TERM_BANNED), pr.name).toBeNull();
    expect(JSON.stringify(pr.params).match(CONFIG_WORDS), pr.name).toBeNull();
  }
});

// Rendered: before the change beat the two rooms draw the same thing (every drawn element of room B is room A's,
// shifted by the rooms' offset) — labels all / none, every preset × ratio.
test(`${ID}: the two rooms are drawn identically before the change (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    for (const pr of presets) for (const [ratio, w, h] of ratios) for (const tv of ['all', 'none']) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      x.seek(0.12 * x.durationMs);
      const svg = x.element;
      const op = e => { let v = 1; for (let q = e; q && q !== svg; q = q.parentElement) { const a = q.getAttribute('opacity'); if (a !== null) v *= parseFloat(a); } return v; };
      const fa = svg.querySelector('[data-node="a-frame"]').getBoundingClientRect(), fb = svg.querySelector('[data-node="b-frame"]').getBoundingClientRect();
      const sig = (room, F) => [...svg.querySelector(`[data-node="${room}-room"]`).querySelectorAll('path, rect, circle, line, text')]
        .filter(e => op(e) > 0.05 && !e.closest('[data-node$="-head"]')).map(e => { const b = e.getBoundingClientRect(); return {k: `${e.tagName}:${e.textContent.trim()}`, v: [b.left - F.left, b.top - F.top, b.width, b.height]}; });
      const A = sig('a', fa), Bs = sig('b', fb);
      if (A.length !== Bs.length || A.some((q, i) => q.k !== Bs[i].k || q.v.some((v, j) => Math.abs(v - Bs[i].v[j]) > 1.5))) fails.push(`${pr.name} ${ratio} ${tv}: rooms differ before the change`);
      x.destroy();
      el.remove();
    }
    return fails;
  }, [ID, presets, RATIOS]);
  expect(out).toEqual([]);
});

// 60 fps, every preset × ratio × labels all / none: a bracket never moves without Party B's hand on its knob (≤ 2 design
// units from the held grip, at a constant offset ± 2) and both arms of every person stay clear of the faces.
test(`${ID}: a bracket moves only in Party B's hand, at a constant grip; arms never cross a face (60 fps, rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, {name: 'es-only', params: {locale: 'es'}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let moves = 0;
    for (const pr of presets) for (const [ratio, w, h] of ratios) for (const tv of ['all', 'none']) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const tag = `${pr.name} ${ratio} ${tv}`;
      let prev = null;
      const d0 = {};
      for (let t = 0; t <= x.durationMs + 1e-6; t += 1000 / 60) {
        x.seek(t);
        const s = x.getState({bounds: false}).semantic;
        if (!s.armsClear) fails.push(`${tag} t${Math.round(t)}: an arm crosses a face`);
        for (const S of ['A', 'B']) {
          const c = s[`br${S}`], hand = s[`hand${S}B`], held = s[`held${S}`];
          if (prev && Math.hypot(c.x - prev[S].x, c.y - prev[S].y) > 0.3) {
            moves++;
            if (!held) { fails.push(`${tag} t${Math.round(t)}: room ${S}'s bracket moves with no hand on it`); continue; }
            const dg = Math.hypot(hand.x - held.grip.x, hand.y - held.grip.y);
            if (dg > 2) fails.push(`${tag} t${Math.round(t)}: room ${S}'s bracket moves, hand ${dg.toFixed(1)} from its grip`);
            const o = {x: hand.x - c.x, y: hand.y - c.y};
            if (!d0[S]) d0[S] = o;
            else if (Math.hypot(o.x - d0[S].x, o.y - d0[S].y) > 2) fails.push(`${tag} t${Math.round(t)}: room ${S} hand offset changes`);
          }
        }
        prev = {A: s.brA, B: s.brB};
      }
      x.destroy();
      el.remove();
    }
    return {fails, moves};
  }, [ID, presets, RATIOS]);
  expect(out.moves).toBeGreaterThan(300);
  expect([...new Set(out.fails.map(f => f.replace(/ t\d+:/, ':').replace(/[0-9.]+ from/, '')))].slice(0, 30)).toEqual([]);
});

// Equal weight (rendered, at the hold, every preset × ratio): the ● of the provided room and the ◆ of the undescribed room
// have the same area (± 8 %), fill and stroke; the two circumstance cards and the two rooms the same size; the glyph stays
// ≥ 4 px clear of the print.
test(`${ID}: provided and undescribed drawn alike in the two rooms (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, {name: 'es-only', params: {locale: 'es'}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    for (const pr of presets) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      x.seek(x.durationMs);
      const svg = x.element;
      const k = 1080 / Math.min(w, h) * (w / svg.getBoundingClientRect().width);
      const got = [];
      for (const r of ['a', 'b']) {
        const grp = [...svg.querySelectorAll(`[data-node^="${r}-ev-in-st-"]`)].find(e => parseFloat(e.getAttribute('opacity') ?? '1') > 0.5);
        const gl = grp.querySelector('circle, path');
        const b = gl.getBoundingClientRect();
        got.push({area: gl.tagName === 'circle' ? Math.PI * (b.width / 2) ** 2 : b.width * b.height / 2, fill: gl.getAttribute('fill'), sw: gl.getAttribute('stroke-width'), card: svg.querySelector(`[data-node="${r}-ev-in-sheet"]`).getBoundingClientRect(), frame: svg.querySelector(`[data-node="${r}-frame"]`).getBoundingClientRect()});
        for (const t of svg.querySelectorAll(`[data-node="${r}-ev-in"] text`)) {
          const tb = t.getBoundingClientRect();
          if (tb.bottom < b.top || tb.top > b.bottom) continue;
          const gap = Math.max(tb.left - b.right, b.left - tb.right) * k;
          if (gap < 4) fails.push(`${pr.name} ${ratio} room ${r}: glyph ${gap.toFixed(1)} px from the print`);
        }
      }
      const [a, b] = got;
      if (Math.abs(a.area - b.area) / a.area > 0.08) fails.push(`${pr.name} ${ratio}: glyph areas ${a.area.toFixed(0)} vs ${b.area.toFixed(0)} px²`);
      if (a.fill !== b.fill || a.sw !== b.sw) fails.push(`${pr.name} ${ratio}: glyph fill / stroke differ`);
      for (const key of ['card', 'frame']) if (Math.abs(a[key].width - b[key].width) > 1 || Math.abs(a[key].height - b[key].height) > 1) fails.push(`${pr.name} ${ratio}: the ${key}s differ in size`);
      x.destroy();
      el.remove();
    }
    return fails;
  }, [ID, presets, RATIOS]);
  expect(out).toEqual([]);
});

// The "only this differs" tag sits within 22 px of the ringed state row it names, off every other object (rendered, at the
// hold, every preset × ratio, labels all).
test(`${ID}: the "only this differs" tag sits by the ringed state row (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let n = 0;
    for (const pr of presets) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      x.seek(x.durationMs);
      const svg = x.element;
      const k = 1080 / Math.min(w, h) * (w / svg.getBoundingClientRect().width);
      for (const r of ['a', 'b']) {
        const tg = svg.querySelector(`[data-node="${r}-tagg"]`);
        if (!tg) continue;
        n++;
        const T = tg.getBoundingClientRect(), R = svg.querySelector(`[data-node="${r}-ev-in-ring"]`).getBoundingClientRect();
        const d = Math.max(0, T.top - R.bottom, R.top - T.bottom) * k;
        if (d > 22) fails.push(`${pr.name} ${ratio} room ${r}: tag ${d.toFixed(1)} px from the ring`);
        for (const o of svg.querySelectorAll(`[data-node^="${r}-obl"][data-node$="-in-sheet"], [data-node="${r}-br-art-brace"]`)) {
          const b = o.getBoundingClientRect();
          if (b.right > T.left && b.left < T.right && b.bottom > T.top && b.top < T.bottom) fails.push(`${pr.name} ${ratio} room ${r}: tag over ${o.getAttribute('data-node')}`);
        }
      }
      x.destroy();
      el.remove();
    }
    return {fails, n};
  }, [ID, presets, RATIOS]);
  expect(out.n).toBeGreaterThan(5);
  expect(out.fails).toEqual([]);
});

noOneWordLines(ID);
noLoneLetterSplit(ID);
noTornNumberUnit(ID);
esAportadoAgrees(ID);

// Every valid clause count renders a full scene (reviewer finding, 2026-10-05: three clauses at 1:1 used to leave
// the scene empty): 1–3 clauses × every section × every preset (+ ES defaults) × ratio × labels all / none — the
// layout fits, both rooms with their boards, cards and people are drawn inside the frame, the text ≥ 16 px (≥ 19.5 px on
// the non-stress presets' own two-clause content) and the heads ≥ 45 px.
test(`${ID}: one to three clauses render a full, legible scene at every ratio (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, {name: 'es-only', params: {locale: 'es'}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let n = 0;
    for (const pr of presets) for (let k = 1; k <= 3; k++) for (const [from, to] of [[1, k], [k, k]]) for (const [ratio, w, h] of ratios) for (const tv of ['all', 'none']) {
      const es = (pr.params.locale || def.defaultParams.locale) === 'es';
      const base = pr.params.clauses || (es ? [] : def.defaultParams.clauses);
      const word = es ? 'Apartado' : 'Clause';
      const clauses = [...Array(k).keys()].map(i => base[i] ?? `${word} ${i + 1}${es ? ' (texto aportado)' : ' (supplied text)'}`);
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, clauses, section: {from, to}, textVisibility: tv}});
      await x.ready;
      x.seek(x.durationMs);
      n++;
      const tag = `${pr.name} ${k} obl ${from}–${to} ${ratio} ${tv}`;
      const s = x.getState({bounds: false}).semantic;
      if (!s.layoutOk) fails.push(`${tag}: layout ${s.why}`);
      if (!(s.textPx >= 16)) fails.push(`${tag}: text ${s.textPx} px`);
      if (!(s.headPx >= 45)) fails.push(`${tag}: heads ${s.headPx} px`);
      if (s.bracketA !== (pr.params.scenarioA?.state === 'undescribed' ? 'open' : 'closed')) fails.push(`${tag}: room A bracket ${s.bracketA}`);
      const svg = x.element;
      const fr = svg.getBoundingClientRect();
      const k1080 = 1080 / Math.min(w, h) * (w / fr.width);
      for (const sel of ['a-frame', 'b-frame', 'a-ev-in-sheet', 'b-ev-in-sheet', 'a-A-head', 'a-B-head', 'b-A-head', 'b-B-head', ...[...Array(k).keys()].flatMap(i => [`a-obl${i}-in-sheet`, `b-obl${i}-in-sheet`])]) {
        const e = svg.querySelector(`[data-node="${sel}"]`);
        const b = e && e.getBoundingClientRect();
        if (!b || b.width * k1080 < 20 || b.height * k1080 < 20) { fails.push(`${tag}: ${sel} missing or tiny`); continue; }
        if (b.left < fr.left - 1 || b.right > fr.right + 1 || b.top < fr.top - 1 || b.bottom > fr.bottom + 1) fails.push(`${tag}: ${sel} outside the frame`);
      }
      if (tv === 'all') {
        const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && !t.closest('[data-layer="content-notice"]'));
        const shown = texts.filter(t => { let op = 1; for (let q = t; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) op *= parseFloat(a); } return op > 0.5; });
        for (const t of shown) {
          const b = t.getBoundingClientRect();
          if (b.left < fr.left - 1 || b.right > fr.right + 1 || b.top < fr.top - 1 || b.bottom > fr.bottom + 1) fails.push(`${tag}: text "${t.textContent.slice(0, 30)}" outside the frame`);
        }
        const all = svg.textContent.replace(/[\u00a0\u2060]/g, ' ');
        for (const txt of clauses) if (!txt.split(/\s+/).slice(0, 2).every(wd => all.includes(wd))) fails.push(`${tag}: "${txt}" not drawn`);
      }
      x.destroy();
      el.remove();
    }
    return {fails, n};
  }, [ID, presets, RATIOS]);
  expect(out.n).toBeGreaterThan(200);
  expect(out.fails.slice(0, 30)).toEqual([]);
});

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

// The connector cord in each room (rendered, at the hold, every preset × ratio × labels all / none): drawn exactly in the
// room whose case is provided for, invisible in the other; its line crosses no printed text and no section card, and its
// socket plug sits on the card's edge.
test(`${ID}: the cord connects only in the room whose case is provided for, clear of every print (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, {name: 'es-only', params: {locale: 'es'}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let n = 0;
    for (const pr of presets) for (const [ratio, w, h] of ratios) for (const tv of ['all', 'none']) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      x.seek(x.durationMs);
      const svg = x.element;
      const p = {...def.defaultParams, ...pr.params};
      for (const rm of ['a', 'b']) {
        const tag = `${pr.name} ${ratio} ${tv} room ${rm}`;
        const provided = (rm === 'a' ? p.scenarioA : p.scenarioB).state === 'provided';
        const cord = svg.querySelector(`[data-node="${rm}-cord"]`);
        const shown = parseFloat(cord.getAttribute('opacity') ?? '1') > 0.5 && parseFloat(cord.getAttribute('stroke-dashoffset')) < 0.01;
        n++;
        if (provided !== shown) fails.push(`${tag}: cord ${shown ? 'drawn' : 'missing'} with provided=${provided}`);
        if (!shown) continue;
        const len = cord.getTotalLength(), ctm = cord.getScreenCTM();
        const pts = [];
        for (let i = 0; i <= 200; i++) { const q = cord.getPointAtLength((i / 200) * len); pts.push(new DOMPoint(q.x, q.y).matrixTransform(ctm)); }
        for (const t of svg.querySelectorAll('text')) {
          if (t.closest('[data-layer="content-notice"]')) continue;
          const b = t.getBoundingClientRect();
          if (b.width && pts.some(q => q.x > b.left + 1 && q.x < b.right - 1 && q.y > b.top + 1 && q.y < b.bottom - 1)) fails.push(`${tag}: the cord crosses "${t.textContent.trim().slice(0, 20)}"`);
        }
        const tagChip = svg.querySelector(`[data-node="${rm}-tagg"]`);
        if (tagChip) { const b = tagChip.getBoundingClientRect(); if (pts.some(q => q.x > b.left + 1 && q.x < b.right - 1 && q.y > b.top + 1 && q.y < b.bottom - 1)) fails.push(`${tag}: the cord crosses the tag`); }
        for (const c of svg.querySelectorAll(`[data-node^="${rm}-obl"][data-node$="-in-sheet"]`)) {
          const b = c.getBoundingClientRect();
          if (pts.some(q => q.x > b.left + 3 && q.x < b.right - 3 && q.y > b.top + 3 && q.y < b.bottom - 3)) fails.push(`${tag}: the cord crosses a section card`);
        }
        const card = svg.querySelector(`[data-node="${rm}-ev-in-sheet"]`).getBoundingClientRect();
        const a = svg.querySelector(`[data-node="${rm}-cord-a"] circle`).getBoundingClientRect();
        const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
        if (!((Math.abs(ax - card.right) < 4 && ay > card.top && ay < card.bottom) || (Math.abs(ay - card.top) < 4 && ax > card.left && ax < card.right))) fails.push(`${tag}: the socket plug is not on the card's edge`);
      }
      x.destroy();
      el.remove();
    }
    return {fails: [...new Set(fails)], n};
  }, [ID, presets, RATIOS]);
  expect(out.n).toBeGreaterThan(40);
  expect(out.fails).toEqual([]);
});
