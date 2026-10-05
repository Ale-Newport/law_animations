// LAW-0485 — Término definido · story. Contract battery + ID-specific checks.
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// the clauses list (one clause is supplied: term.clause), schedules, the definitions list (one definition slip is
// supplied: definition) and priorities. The motif's core content — the word, its clause, one placeholder definition
// slip, the definitions sheet and the contract, and where the slip ends — stays editable (test-comment note only).
// Stress cap (coordinator decision, standing stress cap rule, AUTHORING item 20, 2026-09-26; full text in the presets
// file): long-labels-stress word, clause and definition are capped. True driver: 1:1 — with the near-maximum word
// ("Scheduled Delivery Window"), clause ("Clause 3.2 (supplied placeholder text)") and definition ("Definition 1 (A)" +
// "(supplied placeholder text)") no 1:1 layout fits at 16.1 px: the contract row and the slip wrap to extra lines, so the
// two-slot racks overrun the space above the floor by 44 design units (2 text lines) at card width 18, and at widths
// 20–22 the gap between the racks is too narrow (why "nofit,rackTall,reachA,reachB"). Capped values, all strictly longer
// than the baseline: word 20 vs 10 characters, clause 14 vs 8, definition label 16 vs 12, definition text 18 vs 15; every
// other field keeps its near-maximum length. Pre-cap copy: production/scratch/contract-terms-02/LAW-0485.presets.precap.json.
// acceptanceCheck (brief): continuity of the motion (60 fps, every tracked point — hands, both documents and the
// definition slip), anchored objects (each document leaves its giver's rack from the giver's solved hand and lands at
// the other party's solved hand; the slip passes in Party B's solved hand from one dock to the other) and a
// transformation recognisable with the labels hidden (semantic state: the slip's dock and the thread). The cause precedes
// the visible effect: the slip moves only once the definitions sheet rests at Party B and the term station is reached;
// the thread draws only once the contract has arrived and been unfolded.
// Legal content (high risk): the word is generic and fictional (“Delivery” / «Entrega»); the definition and the clause
// are placeholders; "defined term" and "term with no linked definition" are supplied, neutral configurations of equal
// weight (one slip, the same trays, the same row and underline, no mark on either); no interpretation rule and no
// conclusion about the word (noInterpretationRuleWords, EN and ES, rendered and in the presets); no jurisdiction
// (conceptNeutral); the key reads "As supplied · no conclusion drawn".
// Windows (LAW-0485.js, default order): events at 0.20 · 0.292 · 0.384 (term station) · 0.568 · 0.66 · the slip passes
// 0.439–0.484 · the contract unfolds 0.655–0.70, its row 0.70–0.72, the thread 0.72–0.75 · final state 0.75–0.80 · key
// 0.78–0.83 · notes 0.80–0.85.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, cardsApart, noInterpretationRuleWords, configNeutral, conceptNeutral, TERM_BANNED, CONFIG_WORDS, CONFIG_LABELS, noOneWordLines, noLoneLetterSplit, noTornNumberUnit, esAportadoAgrees, docSize} from './ct02-rendered.js';

const ID = 'LAW-0485';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['handA', 'handB', 'cardP', 'cardR', 'slip'],
  semantic: [
    {at: 0, fn: "s.whereP === 'A' && s.whereR === 'A' && s.stationsShown === 0 && s.slipOn === 'sheet' && s.thread === 0", label: 'rest: each document in its giver\'s rack, the slip in the definitions sheet\'s dock; no thread; the strip is empty'},
    {at: 0.25, fn: "s.whereP === 'route' && s.whereR === 'A' && s.stationsShown === 1 && s.slipOn === 'sheet'", label: 'Party A\'s definitions sheet sets off first (supplied order); one station'},
    {at: 0.415, fn: "s.whereP === 'B' && s.whereR === 'A' && s.slipOn === 'sheet' && s.stationsShown === 3", label: 'the sheet rests at Party B and the term station is reached before the slip moves (cause before effect)'},
    {at: 0.46, fn: "s.slipOn === 'moving' && s.slipHand && s.whereR === 'A'", label: 'Party B\'s hand carries the slip from one dock to the other while the contract rests'},
    {at: 0.53, fn: "s.slipOn === 'contract' && s.whereR === 'A' && s.stationsShown === 3 && s.thread === 0", label: 'the slip lies in the contract\'s dock before the contract leaves; no thread yet'},
    {at: 0.6, fn: "s.whereR === 'route' && s.slipOn === 'contract' && s.thread === 0", label: 'the contract travels with the slip in it'},
    {at: 0.7, fn: "s.whereR === 'B' && s.stationsShown === 5 && s.thread === 0", label: 'the contract has reached Party A and is being unfolded; the thread waits for the row'},
    {at: 1, fn: "JSON.stringify(s.order) === JSON.stringify(['sheet-sent','sheet-received','term-station','contract-sent','contract-received']) && s.finalState === 'term-defined' && s.placement === 'linked' && s.finalShown === 1 && s.thread === 1 && s.layoutOk && s.allReached", label: 'hold: the supplied order; the thread links the word to the definition slip; defined term as supplied, nothing concluded'},
    {at: 0.3, fn: "s.stationsShown === 1 && s.finalShown === 0 && s.slipOn === 'sheet' && s.thread === 0", label: 'seeking back: the slip, the thread and the final state follow the time only'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.finalState === 'term-unlinked' && s.placement === 'external' && s.slipOn === 'sheet' && s.whereP === 'B' && s.whereR === 'B' && s.thread === 0", label: 'alternative: no linked definition as supplied — the slip stays in the sheet; the contract is unfolded with no thread'},
    {at: 0.46, params: P('contrast-or-alternative'), fn: "s.slipOn === 'sheet' && !s.slipHand", label: 'alternative: no hand moves the slip'},
    {at: 1, params: P('long-labels-stress'), fn: "s.slipOn === 'contract' && s.thread === 1 && s.layoutOk", label: 'stress: long labels; the slip in the contract, the thread drawn'},
    {at: 1, params: {sequence: [{event: 'sheet-sent', time: 'Day 2, 09:00 (fictional)'}, {event: 'sheet-received', time: 'Day 2, 09:01 (fictional)', position: 2}, {event: 'term-station', time: 'Defined term (as supplied)', position: 2}, {event: 'contract-sent', time: 'Day 2, 09:05 (fictional)'}, {event: 'contract-received', time: 'Day 2, 09:06 (fictional)'}]}, fn: "s.grouped && s.slipOn === 'contract'", label: 'a shared position: the receipt and the term station as an order to be examined'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.whereR === 'A' && s.slipOn === 'sheet' && s.thread === 0", label: 'actionProgress freezes the action part-way'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.whereP === 'B' && s.whereR === 'B' && s.slipOn === 'contract' && s.thread === 1", label: 'labels hidden: the same journeys, slip hand-over and thread'},
  ],
});

ratioChecks(ID, 'layout fits, reach and flights stay apart', [
  {at: times(0, 1, 0.05), fn: 's.allReached', label: 'every hand reaches its target'},
  {at: [1], fn: 's.layoutOk && s.flightGap >= 0', label: 'layout fits; the two documents never meet'},
  {at: [0.46], fn: "s.placement !== 'linked' || s.slipHand", label: 'Party B\'s hand carries the slip wherever it passes'},
  {at: [1], fn: "s.thread === (s.placement === 'linked' ? 1 : 0)", label: 'the thread is drawn exactly when the slip lies in the contract'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.sheet.reference, p.sheet.title, p.definition.label + ' ' + p.definition.value, p.contract.reference, p.contract.title, p.term.word + ' · ' + p.term.clause, ...p.sequence.map(e => e.time), ...p.parties.map(q => q.name), p.objectLabels.outgoing, p.objectLabels.incoming, ...p.annotations.map(a => a.text)]",
  content: "return [p.sheet.title, p.definition.label + ' ' + p.definition.value, p.contract.title, p.term.word + ' · ' + p.term.clause, ...p.sequence.map(e => e.time)]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
noTextOverProps(ID, ['[data-node="card-p"]', '[data-node="card-r"]', '[data-node="slipfly"]', '[data-node="A-head"]', '[data-node="B-head"]']);
seekHistory(ID);
fill(ID, [0.05, 1], {short: 0.5});
headFloor(ID);
esDefaults(ID);
cardsApart(ID, [['card-p', 'card-r']]);
noInterpretationRuleWords(ID);
conceptNeutral(ID);
docSize(ID, {cards: '^card-[pr]$', times: [0, 0.4, 0.55, 1]});
const LAB = {'term-defined': 'Defined term (as supplied)', 'term-unlinked': 'Term with no linked definition (as supplied)'};
const SEQ = st => [{event: 'sheet-sent', time: 'Day 2, 09:00 (fictional)'}, {event: 'sheet-received', time: 'Day 2, 09:01 (fictional)'}, {event: 'term-station', time: LAB[st]}, {event: 'contract-sent', time: 'Day 2, 09:05 (fictional)'}, {event: 'contract-received', time: 'Day 2, 09:06 (fictional)'}];
const withConfig = (base, st) => ({...base, finalState: st, sequence: (base.sequence || SEQ(st)).map(e => (e.event === 'term-station' ? {...e, time: LAB[st]} : e))});
configNeutral(ID, [
  [withConfig({}, 'term-defined'), withConfig({}, 'term-unlinked')],
  [withConfig(P('contrast-or-alternative'), 'term-defined'), P('contrast-or-alternative')],
], ['']);

// The supplied parameters of every preset carry no banned wording either (EN and ES); the configuration words appear
// only in the exact supplied labels.
test(`${ID}: no preset supplies interpretation-rule, meaning, outcome or obligation wording (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) {
    expect(JSON.stringify(pr.params).match(TERM_BANNED), pr.name).toBeNull();
    for (const e of pr.params.sequence || []) if (CONFIG_WORDS.test(e.time)) expect(CONFIG_LABELS, pr.name).toContain(e.time);
  }
});

// The banned-word list itself catches the wording it must catch (EN and ES) and passes the motif's own wording.
test(`${ID}: the banned-word list catches interpretation and outcome wording and passes the supplied wording`, () => {
  for (const w of ['contra proferentem', 'interpreted against the drafter', 'interpretado en contra', 'interpretation rule', 'plain meaning', 'ordinary meaning', 'sentido literal', 'canons of construction', 'ambiguous', 'Ambiguous term', 'término ambiguo', 'ambigua', 'ambigüedad', 'unclear', 'poco claro', 'vague', 'vago', 'means legally', 'significa jurídicamente', 'must', 'debe', 'binding', 'vinculante', 'valid', 'válido', 'enforceable', 'exigible', 'outcome', 'defective', 'missing definition', 'law', 'ley']) expect(w, w).toMatch(TERM_BANNED);
  for (const w of [...CONFIG_LABELS, 'Definition 1 (supplied text)', 'Definición 1 (texto aportado)', '“Delivery” · Clause 3', '«Entrega» · Cláusula 3', 'Definitions sheet (fictional)', 'Hoja de definiciones (ficticia)', 'Contract (fictional)', 'Contrato (ficticio)', 'As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión', 'Definition slip', 'Definición (ficha)', 'Word linked to Definition 1 in contract B (as supplied)']) expect(w, w).not.toMatch(TERM_BANNED);
  expect('Término ambiguo').toMatch(TERM_BANNED);
});

// The term station is reached before the slip moves, and the slip lies in the contract before it leaves; the thread
// draws only after the contract has arrived — in every preset and ratio (the cause precedes the effect; 'no linked
// definition' never moves the slip nor draws the thread).
test(`${ID}: the slip moves only after the term station, the thread only after the contract arrives (every preset × ratio)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, {name: 'default-es', params: {locale: 'es'}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      let stationAt = null, movedAt = null, inSetAt = null, leftAt = null, arrivedAt = null, threadAt = null, linked = null;
      for (let k = 0; k <= 200; k++) {
        x.seek((k / 200) * x.durationMs);
        const s = x.getState({bounds: false}).semantic;
        linked = s.placement === 'linked';
        if (stationAt === null && s.stationsShown >= 3) stationAt = k;
        if (movedAt === null && s.slipOn !== 'sheet') movedAt = k;
        if (inSetAt === null && s.slipOn === 'contract') inSetAt = k;
        if (leftAt === null && s.whereR !== 'A') leftAt = k;
        if (arrivedAt === null && s.whereR === 'B') arrivedAt = k;
        if (threadAt === null && s.thread > 0) threadAt = k;
      }
      if (!linked) { if (movedAt !== null || threadAt !== null) fails.push(`${pr.name} ${ratio}: no linked definition, yet the slip moved or a thread was drawn`); }
      else if ([stationAt, movedAt, inSetAt, leftAt, arrivedAt, threadAt].includes(null)) fails.push(`${pr.name} ${ratio}: missing ${stationAt} ${movedAt} ${inSetAt} ${leftAt} ${arrivedAt} ${threadAt}`);
      else if (!(stationAt < movedAt && inSetAt < leftAt && arrivedAt < threadAt)) fails.push(`${pr.name} ${ratio}: station ${stationAt} · moved ${movedAt} · in set ${inSetAt} · left ${leftAt} · arrived ${arrivedAt} · thread ${threadAt}`);
      x.destroy();
      el.remove();
    }
    return fails;
  }, [ID, presets]);
  expect(out).toEqual([]);
});

// Rendered: the thread ends on the definition slip lying in the contract's dock and starts at the word's row node, and
// the word's underline (labels on) or dark word bar (labels hidden) is drawn — every preset × ratio × labels, at the hold.
test(`${ID}: the thread links the word's row to the definition slip (rendered, every preset × ratio × labels)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let n = 0;
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) for (const tv of ['all', 'none']) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      x.seek(x.durationMs);
      const s = x.getState({bounds: false}).semantic;
      const q = nm => x.element.querySelector(`[data-node="${nm}"]`);
      const eff = e => { let o = 1; for (let z = e; z && z !== x.element; z = z.parentNode) { if (!z.getAttribute) continue; const a = z.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
      const word = q(tv === 'all' ? 'card-r-under' : 'card-r-wordbar');
      if (!word || eff(word) < 0.8) fails.push(`${pr.name} ${ratio} ${tv}: the word mark is not shown`);
      const th = q('card-r-thread-p');
      if (s.placement !== 'linked') { if (th && eff(th) > 0.01) fails.push(`${pr.name} ${ratio} ${tv}: a thread with no linked definition`); }
      else {
        n++;
        const slip = q('card-r-slip').getBoundingClientRect(), node = q('card-r-node0').getBoundingClientRect();
        const L = th.getTotalLength(), m = th.getScreenCTM();
        const a = new DOMPoint(th.getPointAtLength(0).x, th.getPointAtLength(0).y).matrixTransform(m), b = new DOMPoint(th.getPointAtLength(L).x, th.getPointAtLength(L).y).matrixTransform(m);
        if (eff(th) < 0.99 || parseFloat(th.getAttribute('stroke-dashoffset')) > 0.5) fails.push(`${pr.name} ${ratio} ${tv}: thread not fully drawn`);
        if (Math.hypot(a.x - (node.left + node.width / 2), a.y - (node.top + node.height / 2)) > 2) fails.push(`${pr.name} ${ratio} ${tv}: thread does not start at the row node`);
        if (Math.abs(b.x - slip.left) > 3 || b.y < slip.top || b.y > slip.bottom) fails.push(`${pr.name} ${ratio} ${tv}: thread does not end on the slip`);
      }
      x.destroy();
      el.remove();
    }
    return {fails, n};
  }, [ID, presets]);
  expect(out.n).toBeGreaterThan(10);
  expect(out.fails).toEqual([]);
});

// Rendered: the two documents at equal weight — the same sheet size, the same trays — in every preset × ratio at rest.
test(`${ID}: the two documents and their docks at equal weight (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      x.seek(0.05 * x.durationMs);
      const box = n => x.element.querySelector(`[data-node="${n}"]`).getBoundingClientRect();
      for (const part of ['sheet', 'dock']) {
        const a = box(`card-p-${part}`), b = box(`card-r-${part}`);
        if (Math.abs(a.width - b.width) > 1 || Math.abs(a.height - b.height) > 1) fails.push(`${pr.name} ${ratio} ${part}: ${a.width.toFixed(0)}×${a.height.toFixed(0)} vs ${b.width.toFixed(0)}×${b.height.toFixed(0)}`);
      }
      x.destroy();
      el.remove();
    }
    return fails;
  }, [ID, presets]);
  expect(out).toEqual([]);
});

// The term station's supplied label and the supplied configuration never contradict each other: every preset (and the
// defaults) is consistent, the module flags a contradiction (layoutOk false), and at the hold no rendered text names both
// configurations (labels on, every ratio).
test(`${ID}: the station label and the configuration cannot contradict (presets, flag, rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, {name: 'default-es', params: {locale: 'es'}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    const both = t => /(defined term|término definido)/i.test(t) && /(no linked definition|sin definición enlazada)/i.test(t);
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      x.seek(x.durationMs);
      const s = x.getState({bounds: false}).semantic;
      if (!s.statusConsistent) fails.push(`${pr.name} ${ratio}: inconsistent`);
      const eff = e => { let o = 1; for (let q = e; q && q !== x.element; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
      const txt = [...x.element.querySelectorAll('text')].filter(t => eff(t) > 0.5).map(t => t.textContent).join(' | ');
      if (both(txt)) fails.push(`${pr.name} ${ratio}: both configurations rendered`);
      x.destroy();
      el.remove();
    }
    const el = document.createElement('div');
    document.getElementById('slots').appendChild(el);
    const x = def.create(el, {width: 1920, height: 1080, params: {finalState: 'term-unlinked'}});
    await x.ready;
    x.seek(x.durationMs);
    const s = x.getState({bounds: false}).semantic;
    if (s.statusConsistent || s.layoutOk) fails.push('contradiction not flagged');
    x.destroy();
    el.remove();
    return fails;
  }, [ID, presets]);
  expect(out).toEqual([]);
});

// Rendered leaders (labels on, every preset × ratio, at the hold): each annotation's leader ends on its target's edge
// (a card's face or the strip's stations, within 3 px), and crosses no person's whole outline, no card but its target, no
// rack but the one that holds its target card and no visible exchange path; it never ends on another label or chip.
test(`${ID}: leaders end on their targets and cross no rack, card or person (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {annotations: [{target: 'sheet', text: 'Party A\'s document, as supplied'}, {target: 'sequence', text: 'Order as supplied'}]}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let n = 0;
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      x.seek(x.durationMs);
      const svg = x.element;
      const B = nm => { const e = svg.querySelector(`[data-node="${nm}"]`); return e ? e.getBoundingClientRect() : null; };
      // (the sequence's target: its stations — never the strip's title row with the final status chip)
      const ph = [...svg.querySelectorAll('[data-node^="seq-ph"]')].map(e => e.getBoundingClientRect());
      const stations = ph.length ? {left: Math.min(...ph.map(b => b.left)), right: Math.max(...ph.map(b => b.right)), top: Math.min(...ph.map(b => b.top)), bottom: Math.max(...ph.map(b => b.bottom))} : null;
      const targets = {document: B('card-p-face'), set: B('card-r-face'), sequence: stations};
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return o; };
      const labels = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && eff(t) > 0.05 && !t.closest('[data-layer="content-notice"]')).map(t => t.getBoundingClientRect());
      const finalChip = svg.querySelector('[data-node="seq-final"]');
      if (finalChip && eff(finalChip) > 0.05) labels.push(finalChip.getBoundingClientRect());
      // (the exchange paths while visible: points along each drawn route)
      const paths = [...svg.querySelectorAll('[data-node^="route-"]')].filter(e => eff(e) > 0.05).flatMap(e => { const Lp = e.getTotalLength(), m = e.getScreenCTM(); return Array.from({length: 121}, (_, i) => { const q = e.getPointAtLength(Lp * i / 120); return new DOMPoint(q.x, q.y).matrixTransform(m); }); });
      const racks = [B('rackA'), B('rackB')];
      const people = [B('A'), B('B')];
      const inBox = (q, b, m = 0) => q.x >= b.left - m && q.x <= b.right + m && q.y >= b.top - m && q.y <= b.bottom + m;
      // (on the edge: within 3 px outside and 7 px inside the drawn face — its shadow included; the strip's outline is
      // padded round its stations: within 12 px of them)
      const onEdge = (q, b, m = 3) => inBox(q, b, m) && !(q.x > b.left + 7 && q.x < b.right - 7 && q.y > b.top + 7 && q.y < b.bottom - 7);
      for (const ld of svg.querySelectorAll('[data-node$="-lead"]')) {
        if (ld.getAttribute('opacity') === '0') continue;
        n++;
        const L = ld.getTotalLength(), m = ld.getScreenCTM();
        const pts = [];
        for (let i = 0; i <= 200; i++) { const q = ld.getPointAtLength(L * i / 200); pts.push(new DOMPoint(q.x, q.y).matrixTransform(m)); }
        const end = pts[pts.length - 1];
        // (a note on the sequence may stand in an empty cell of the strip's grid and point at its nearest station)
        const tk = Object.keys(targets).find(k => targets[k] && onEdge(end, targets[k], k === 'sequence' ? 12 : 3)) || (ph.some(b => onEdge(end, b, 3)) ? 'sequence' : undefined);
        const tag = `${pr.name} ${ratio} ${ld.getAttribute('data-node')}`;
        if (!tk) { fails.push(`${tag}: does not end on a target's edge`); continue; }
        const tb = targets[tk];
        const holder = racks.find(r0 => r0 && inBox({x: tb.left + 1, y: tb.top + 1}, r0) && inBox({x: tb.right - 1, y: tb.bottom - 1}, r0));
        const inner = pts.slice(0, -4);
        for (const r0 of racks) if (r0 && r0 !== holder && inner.some(q => inBox(q, r0, -1))) fails.push(`${tag}: crosses a rack`);
        for (const [k, c] of Object.entries(targets)) if (k !== tk && k !== 'sequence' && c && inner.some(q => inBox(q, c, 6))) fails.push(`${tag}: crosses ${k}`);
        for (const f of people) if (f && inner.some(q => inBox(q, f, 2))) fails.push(`${tag}: crosses a person`);
        // (it ends on no other label or chip, and crosses no visible exchange path)
        if (labels.some(b => inBox(end, b, 2))) fails.push(`${tag}: ends on a label`);
        if (inner.some(q => paths.some(c => Math.hypot(c.x - q.x, c.y - q.y) < 3))) fails.push(`${tag}: crosses a path`);
      }
      x.destroy();
      el.remove();
    }
    return {fails: [...new Set(fails)], n};
  }, [ID, presets]);
  expect(out.n).toBeGreaterThan(10);
  expect(out.fails).toEqual([]);
});

// How wrapped text breaks (every preset + es-only × ratio, u step 0.05): no one-word line, no lone letter or ID split
// from its word, no number torn from its unit, and no Spanish "(aportado)" after a feminine or plural word.
noOneWordLines(ID);
noLoneLetterSplit(ID);
noTornNumberUnit(ID);
esAportadoAgrees(ID);
