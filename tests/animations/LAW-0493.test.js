// LAW-0493 — Condición de activación · story. Contract battery + ID-specific checks.
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// clauses (the event card and the obligation cards stand for the clauses: event, obligations), schedules, definitions
// and priorities (no priority or order between obligations is drawn). The motif's core content — the event, its two
// supplied states, the obligations, the supplied tranche and the hold configuration — stays editable (test-comment
// note only). No stress field is capped.
// acceptanceCheck (brief): continuity of the motion (60 fps, every tracked point — both hands, the event card and the
// bracket), anchored objects (the event card moves only in Party A's hand, held by its grip tab at a constant offset; the
// bracket moves only in Party B's hand, held by its knob at a constant offset) and a transformation recognisable with the
// labels hidden (the card is seated, the bracket slides shut: semantic state and rendered geometry). The event card is
// seated before the bracket moves.
// Legal content (very high risk: conditions): no rule on conditions — no condition precedent / subsequent, no
// fulfilment, no "deemed" fulfilment, no automatic effect, nothing becomes due, binding or enforceable
// (noConditionRuleWords, EN and ES, rendered and in the presets); no jurisdiction (conceptNeutral); produced and pending
// are supplied states of equal weight (● and ◆ of the same area, colour and stroke; the card the same size); the bracket
// only marks the supplied tranche; the key reads "As supplied · no conclusion drawn".
// Windows (LAW-0493.js): the event card 0.16–0.40 · the bracket 0.44–0.66 (produced only) · final state 0.75–0.80 ·
// key 0.78–0.83 · notes 0.80–0.85.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, noConditionRuleWords, peopleNeutral, conceptNeutral, TERM_BANNED, CONFIG_WORDS, CONFIG_LABELS, CONFIG_LABEL, noOneWordLines, noLoneLetterSplit, noTornNumberUnit, esAportadoAgrees, docSize} from './ct04-rendered.js';

const ID = 'LAW-0493';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const RATIOS = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];

contractSuite(ID, {
  continuity: ['handA', 'handB', 'evPos', 'brPos'],
  semantic: [
    {at: 0, fn: "s.eventAt === 'tray' && s.bracket === 'open' && s.finalShown === 0", label: 'rest: the event card in its tray; the bracket open'},
    {at: 0.3, fn: "s.eventAt === 'moving' && s.heldA && s.bracket === 'open'", label: 'Party A seats the event card'},
    {at: 0.42, fn: "s.eventAt === 'slot' && s.bracket === 'open'", label: 'the card seated before the bracket moves'},
    {at: 0.55, fn: "s.bracket === 'moving' && s.heldB", label: 'Party B slides the bracket'},
    {at: 1, fn: "s.bracket === 'closed' && s.finalState === 'produced' && s.finalShown === 1 && s.keyShown === 1 && s.layoutOk && s.allReached", label: 'hold: the bracket marks the tranche as supplied; key'},
    {at: 0.2, fn: "s.bracket === 'open' && s.finalShown === 0", label: 'seeking back: the bracket and the final state follow the time only'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.finalState === 'pending' && s.bracket === 'open' && s.eventAt === 'slot' && !s.heldB", label: 'alternative: pending as supplied — the bracket stays open'},
    {at: 1, params: P('long-labels-stress'), fn: "s.bracket === 'closed' && JSON.stringify(s.tranche) === '[2,3]' && s.layoutOk", label: 'stress: the tranche 2–3 marked'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.eventAt !== 'slot' && s.bracket === 'open'", label: 'actionProgress freezes the action part-way'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.eventAt === 'slot' && s.bracket === 'closed'", label: 'labels hidden: the same action'},
  ],
});

ratioChecks(ID, 'layout fits, reach, order', [
  {at: times(0, 1, 0.05), fn: 's.allReached && s.armsClear', label: 'every hand reaches its target; arms clear of the faces'},
  {at: [1], fn: 's.layoutOk', label: 'layout fits'},
  {at: [0.43], fn: "s.eventAt === 'slot' && s.bracket === 'open'", label: 'the card seated before the bracket moves'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title, p.panels.event, p.panels.tranche, p.event.label, p.stateLabels[p.finalState], ...p.obligations, ...p.parties.map(q => q.name), p.objectLabels.tray, ...p.annotations.map(a => a.text)]",
  content: "return [p.event.label, p.stateLabels[p.finalState], ...p.obligations]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
noTextOverProps(ID, ['[data-node="ev"]', '[data-node="br"]', '[data-node="A-head"]', '[data-node="B-head"]']);
seekHistory(ID);
fill(ID, [0.05, 1], {short: 0.5});
headFloor(ID, {floors: Object.fromEntries(['default', 'baseline-illustrative', 'contrast-or-alternative', 'baseline-es'].flatMap(n => [[`${n}|1:1`, 55], [`${n}|16:9`, 60], [`${n}|9:16`, 60]]))});
esDefaults(ID);
noConditionRuleWords(ID);
conceptNeutral(ID);
docSize(ID, {cards: '^(ev-in|obl\\d-in)$', times: [0, 0.4, 1], floor: 70});
peopleNeutral(ID, [[{finalState: 'produced'}, {finalState: 'pending'}], [P('contrast-or-alternative'), {...P('contrast-or-alternative'), finalState: 'produced'}]], ['']);

// The supplied parameters of every preset carry no banned wording either (EN and ES); the configuration words appear
// only in the exact supplied labels.
test(`${ID}: no preset supplies rule, conclusion or condition wording (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) {
    expect(JSON.stringify(pr.params).match(TERM_BANNED), pr.name).toBeNull();
    expect(JSON.stringify(pr.params).match(CONFIG_WORDS), pr.name).toBeNull();
  }
});

// The banned-word list itself catches the wording it must catch (EN and ES) and passes the motif's own wording.
test(`${ID}: the banned-word list catches condition and conclusion wording and passes the supplied wording`, () => {
  for (const w of ['condition precedent', 'condition subsequent', 'subject to the condition', 'condición suspensiva', 'condición resolutoria', 'condicion', 'the condition is fulfilled', 'condición cumplida', 'cumplimiento', 'deemed fulfilled', 'due', 'now due', 'exigible', 'binding', 'vinculante', 'enforceable', 'triggered liability', 'activated', 'obligación activada', 'automatic effect', 'efecto automático', 'breach', 'incumplimiento', 'must', 'debe', 'valid', 'válido', 'outcome', 'resultado', 'law', 'ley']) expect(w, w).toMatch(TERM_BANNED);
  for (const w of [...CONFIG_LABELS, 'Event 1 (supplied)', 'Evento 1 (aportado)', 'Event produced (as supplied)', 'Evento producido (según lo aportado)', 'Event pending (as supplied)', 'Evento pendiente (según lo aportado)', 'Obligation 1 (supplied text)', 'Obligación 1 (texto aportado)', 'Tranche of obligations', 'Tramo de obligaciones', 'Contract (fictional)', 'Contrato (ficticio)', 'As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión', 'Event tray', 'Bandeja del evento', 'Lucía Ferrer · Party A', 'The bracket marks the supplied tranche']) expect(w, w).not.toMatch(TERM_BANNED);
  for (const w of CONFIG_LABELS) { expect(w).toMatch(CONFIG_WORDS); expect(w).toMatch(CONFIG_LABEL); }
  expect('A: tranche marked as supplied').toMatch(CONFIG_LABEL);
  expect('Tranche marked as supplied, now due').not.toMatch(CONFIG_LABEL);
});

/** In-page helper: effective opacity of an element. */
const EFF = 'const eff = (svg, e) => { let v = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute("opacity"); if (a !== null) v *= parseFloat(a); if (q.getAttribute("display") === "none") return 0; } return v; };';

// 60 fps, every preset (+ es-only) × ratio × labels all / none: an object never moves without its party's hand on it.
// Whenever the event card (Party A) or the bracket (Party B) moves, the semantic names it as held, the hand is at the held
// grip (≤ 2 design units: the card's grip tab; the bracket's knob) and the hand stays at a constant offset from the object
// (± 2 units). Both arms of both people stay clear of their heads at every frame (AUTHORING item 6).
test(`${ID}: the card and the bracket move only in their party's hand, at a constant grip; arms never cross a face (60 fps, rendered)`, async ({page}) => {
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
        if (!s.allReached) fails.push(`${tag} t${Math.round(t)}: a hand out of reach`);
        for (const [S, key] of [['A', 'evPos'], ['B', 'brPos']]) {
          const c = s[key], hand = s[`hand${S}`], held = s[`held${S}`];
          if (prev && Math.hypot(c.x - prev[key].x, c.y - prev[key].y) > 0.3) {
            moves++;
            if (!held) { fails.push(`${tag} t${Math.round(t)}: ${key} moves with no hand on it`); continue; }
            const dg = Math.hypot(hand.x - held.grip.x, hand.y - held.grip.y);
            if (dg > 2) fails.push(`${tag} t${Math.round(t)}: ${key} moves, hand ${dg.toFixed(1)} from its grip`);
            const o = {x: hand.x - c.x, y: hand.y - c.y};
            if (!d0[key]) d0[key] = o;
            else if (Math.hypot(o.x - d0[key].x, o.y - d0[key].y) > 2) fails.push(`${tag} t${Math.round(t)}: ${key} hand offset ${o.x.toFixed(1)},${o.y.toFixed(1)} vs ${d0[key].x.toFixed(1)},${d0[key].y.toFixed(1)}`);
          }
        }
        prev = {evPos: s.evPos, brPos: s.brPos};
      }
      x.destroy();
      el.remove();
    }
    return {fails, moves};
  }, [ID, presets, RATIOS]);
  expect(out.moves).toBeGreaterThan(500);
  const seen = new Set();
  expect(out.fails.filter(f => { const k = f.replace(/ t\d+:/, ':').replace(/[-0-9.]+,[-0-9.]+ vs [-0-9.]+,[-0-9.]+|[0-9.]+ from/, ''); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 30)).toEqual([]);
});

// The hands never pass over a printed text other than their own object's (60 fps, every preset × ratio, labels all):
// a hand's box never covers more than a sliver of a visible text (the card's print stays readable while it is carried).
test(`${ID}: the hands never cover a label or a plate (60 fps, rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, {name: 'es-only', params: {locale: 'es'}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets, ratios, EFF]) => {
    eval(EFF.replace('const eff', 'globalThis.eff'));
    const def = await window.__lib.load(id);
    const fails = [];
    let n = 0;
    for (const pr of presets) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      const svg = x.element;
      const hands = ['A-near-hand', 'B-near-hand', 'A-far-hand', 'B-far-hand'].map(nm => svg.querySelector(`[data-node="${nm}"]`)).filter(Boolean);
      const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && !t.closest('[data-layer="content-notice"]'));
      for (let t = 0; t <= x.durationMs + 1e-6; t += 1000 / 60) {
        x.seek(t);
        const hb = hands.map(e => e.getBoundingClientRect());
        for (const tx of texts) {
          if (eff(svg, tx) < 0.3) continue;
          const b = tx.getBoundingClientRect();
          for (const q of hb) {
            n++;
            const ox = Math.min(b.right, q.right) - Math.max(b.left, q.left), oy = Math.min(b.bottom, q.bottom) - Math.max(b.top, q.top);
            if (ox > 0.15 * Math.min(b.width, q.width) && oy > 0.3 * b.height) fails.push(`${pr.name} ${ratio} t${Math.round(t)}: a hand over "${tx.textContent.trim().slice(0, 20)}"`);
          }
        }
      }
      x.destroy();
      el.remove();
    }
    return {fails: [...new Set(fails.map(f => f.replace(/ t\d+:/, ':')))], n};
  }, [ID, presets, RATIOS, EFF]);
  expect(out.n).toBeGreaterThan(1000);
  expect(out.fails.slice(0, 20)).toEqual([]);
});

// The bracket marks exactly the supplied tranche (rendered, at the hold, every preset × ratio × labels all / none):
// closed, its brace spans the tranche's first card top to its last card bottom (within a row gap) and stays right of
// the cards' print; open (pending), its arms keep clear of every card. No arrowhead, no dash.
test(`${ID}: the bracket marks the supplied tranche only, solid and plain (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
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
      const s = x.getState({bounds: false}).semantic;
      const k = 1080 / Math.min(w, h) * (w / svg.getBoundingClientRect().width);
      const brace = svg.querySelector('[data-node="br-art-brace"]');
      const B = brace.getBoundingClientRect();
      if (brace.getAttribute('stroke-dasharray') || brace.getAttribute('marker-end')) fails.push(`${pr.name} ${ratio} ${tv}: dashed or arrowed bracket`);
      const cards = [...svg.querySelectorAll('[data-node$="-in-sheet"]')].filter(e => /^obl\d-in-sheet$/.test(e.getAttribute('data-node'))).map(e => e.getBoundingClientRect());
      const [i0, i1] = [s.tranche[0] - 1, s.tranche[1] - 1];
      n++;
      if (s.bracket === 'closed') {
        if (B.top > cards[i0].top + 1 || B.bottom < cards[i1].bottom - 1) fails.push(`${pr.name} ${ratio} ${tv}: the brace does not span the tranche`);
        const gap = (cards.length > 1 ? (cards[1].top - cards[0].bottom) : 30) + 2;
        if (cards[i0].top - B.top > gap || B.bottom - cards[i1].bottom > gap) fails.push(`${pr.name} ${ratio} ${tv}: the brace reaches past the tranche`);
        // (the spine: the brace's right edge less its stroke; the arms: its top and bottom strips)
        const sw = parseFloat(brace.getAttribute('stroke-width')) * brace.getScreenCTM().a;
        for (const t of svg.querySelectorAll('[data-node^="obl"] text')) {
          const b = t.getBoundingClientRect();
          if (b.right > B.right - sw - 4 / k && b.bottom > B.top && b.top < B.bottom) fails.push(`${pr.name} ${ratio} ${tv}: the spine touches the print`);
          if (b.right > B.left && b.left < B.right && ((b.top < B.top + sw + 2 / k && b.bottom > B.top) || (b.bottom > B.bottom - sw - 2 / k && b.top < B.bottom))) fails.push(`${pr.name} ${ratio} ${tv}: an arm touches the print`);
        }
      } else if (cards.some(c => c.right > B.left - 2 / k && c.bottom > B.top && c.top < B.bottom)) fails.push(`${pr.name} ${ratio} ${tv}: the open bracket touches a card`);
      x.destroy();
      el.remove();
    }
    return {fails: [...new Set(fails)], n};
  }, [ID, presets, RATIOS]);
  expect(out.n).toBeGreaterThan(10);
  expect(out.fails).toEqual([]);
});

// Equal weight of the two supplied states (rendered): the same scene with "produced" and with "pending" draws the event
// card at the same size and the ● and ◆ glyphs with the same area (± 8 %), the same fill and the same stroke; the two
// people at the same figure scale — every ratio.
test(`${ID}: produced and pending at equal weight; the two people alike (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async ([id, ratios]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    for (const [ratio, w, h] of ratios) {
      const got = {};
      for (const st of ['produced', 'pending']) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {finalState: st}});
        await x.ready;
        x.seek(x.durationMs);
        const g = x.element.querySelector(`[data-node="ev-in-st-${st}"]`);
        const gl = g.querySelector('circle, path');
        const b = gl.getBoundingClientRect();
        got[st] = {area: st === 'produced' ? Math.PI * (b.width / 2) ** 2 : b.width * b.height / 2, fill: gl.getAttribute('fill'), sw: gl.getAttribute('stroke-width'), card: x.element.querySelector('[data-node="ev-in-sheet"]').getBoundingClientRect()};
        const ka = x.element.querySelector('[data-node="A"]').getAttribute('transform'), kb = x.element.querySelector('[data-node="B"]').getAttribute('transform');
        const sc = t => Math.abs(parseFloat((t.match(/scale\(([-0-9.]+)/) || [])[1]));
        if (Math.abs(sc(ka) - sc(kb)) > 1e-6) fails.push(`${ratio}: people scales differ`);
        x.destroy();
        el.remove();
      }
      const a = got.produced, b = got.pending;
      if (Math.abs(a.area - b.area) / a.area > 0.08) fails.push(`${ratio}: ● ${a.area.toFixed(0)} vs ◆ ${b.area.toFixed(0)} px²`);
      if (a.fill !== b.fill || a.sw !== b.sw) fails.push(`${ratio}: glyph fill / stroke differ`);
      if (Math.abs(a.card.width - b.card.width) > 1 || Math.abs(a.card.height - b.card.height) > 1) fails.push(`${ratio}: the event card changes size with the state`);
    }
    return fails;
  }, [ID, RATIOS]);
  expect(out).toEqual([]);
});

// The ●/◆ glyph stays ≥ 4 px clear of the card print (every preset + es-only × ratio, at the hold).
test(`${ID}: the state glyph stays ≥ 4 px clear of the card print (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, {name: 'es-only', params: {locale: 'es'}}, ...presetsFor(ID)];
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
      for (const grp of svg.querySelectorAll('[data-node^="ev-in-st-"]')) {
        if (parseFloat(grp.getAttribute('opacity') ?? '1') < 0.5) continue;
        const gb = grp.querySelector('circle, path').getBoundingClientRect();
        for (const t of svg.querySelectorAll('[data-node="ev-in"] text')) {
          const tb = t.getBoundingClientRect();
          if (tb.bottom < gb.top || tb.top > gb.bottom) continue;
          n++;
          const gap = Math.max(tb.left - gb.right, gb.left - tb.right) * k;
          if (gap < 4) fails.push(`${pr.name} ${ratio}: glyph ${gap.toFixed(1)} px from "${t.textContent.trim().slice(0, 16)}"`);
        }
      }
      x.destroy();
      el.remove();
    }
    return {fails, n};
  }, [ID, presets, RATIOS]);
  expect(out.n).toBeGreaterThan(10);
  expect(out.fails).toEqual([]);
});

noOneWordLines(ID);
noLoneLetterSplit(ID);
noTornNumberUnit(ID);
esAportadoAgrees(ID);

// Long unbroken tokens (fix2-contract-terms-04, reviewer request 2026-10-05): a 33-, 42- or 55-character word in the event
// label, an obligation, a state label or a party name — over the default content and over the long-labels-stress content
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
    for (const tok of TOK) for (const [bn, base] of [['default', {}], ['stress', stress]]) for (const field of ['event', 'obligation', 'state', 'name']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const p = structuredClone(base);
      if (field === 'event') p.event = {label: `${tok} 1`};
      if (field === 'obligation') p.obligations = [`${tok} 1`, ...(p.obligations ?? d.obligations).slice(1)];
      if (field === 'state') p.stateLabels = {produced: tok, pending: (p.stateLabels ?? d.stateLabels).pending};
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
