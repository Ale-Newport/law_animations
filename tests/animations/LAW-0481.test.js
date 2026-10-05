// LAW-0481 — Cláusula incorporada · story. Contract battery + ID-specific checks.
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// the clauses list, schedules, definitions and priorities. The motif's core content — one placeholder clause slip, the
// auxiliary document and the contract set, and where the slip ends — stays editable (test-comment note only).
// acceptanceCheck (brief): continuity of the motion (60 fps, every tracked point — hands, both documents and the clause
// slip), anchored objects (each document leaves its giver's rack from the giver's solved hand and lands at the other
// party's solved hand; the slip passes in Party B's solved hand from one dock to the other) and a transformation
// recognisable with the labels hidden (semantic state only). The cause precedes the visible effect: the slip moves only
// once the auxiliary document rests at Party B and its clause station is reached, and the contract set leaves only after.
// Legal content (very high risk): the clause is a placeholder ("Clause 7 (supplied text)"); "clause linked" and "external
// text" are supplied, neutral configurations of equal weight (one slip, the same trays, no mark on either); no
// incorporation rule and no conclusion (noIncorporationRuleWords, EN and ES, rendered and in the presets); no
// jurisdiction (conceptNeutral); the key reads "As supplied · no conclusion drawn".
// Windows (LAW-0481.js, default order): events at 0.20 · 0.304 · 0.408 (clause station) · 0.616 · 0.72 · the slip passes
// 0.463–0.508 (Party B's hand 0.438–0.533; its print fades out before and back in after) · final state 0.75–0.80 · key
// 0.78–0.83 · notes 0.80–0.85.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, cardsApart, noIncorporationRuleWords, configNeutral, conceptNeutral, INCORPORATION_BANNED, LINK_LABEL, noOneWordLines, noLoneLetterSplit, noTornNumberUnit, esAportadoAgrees, docSize} from './cf11-rendered.js';

const ID = 'LAW-0481';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['handA', 'handB', 'cardP', 'cardR', 'slip'],
  semantic: [
    {at: 0, fn: "s.whereP === 'A' && s.whereR === 'A' && s.stationsShown === 0 && s.slipOn === 'document'", label: 'rest: each document in its giver\'s rack, the slip in the auxiliary document\'s dock; the strip is empty'},
    {at: 0.27, fn: "s.whereP === 'route' && s.whereR === 'A' && s.stationsShown === 1 && s.slipOn === 'document'", label: 'Party A\'s auxiliary document sets off first (supplied order); one station'},
    {at: 0.435, fn: "s.whereP === 'B' && s.whereR === 'A' && s.slipOn === 'document' && s.stationsShown === 3", label: 'the auxiliary document rests at Party B and the clause station is reached before the slip moves (cause before effect)'},
    {at: 0.47, fn: "s.slipOn === 'moving' && s.slipHand && s.whereR === 'A'", label: 'Party B\'s hand carries the slip from one dock to the other while the contract set rests'},
    {at: 0.56, fn: "s.slipOn === 'set' && s.whereR === 'A' && s.stationsShown === 3", label: 'the slip lies in the contract set\'s dock before the set leaves'},
    {at: 0.66, fn: "s.whereR === 'route' && s.slipOn === 'set'", label: 'the contract set travels with the slip in it'},
    {at: 0.76, fn: "s.whereR === 'B' && s.stationsShown === 5 && s.allReached", label: 'the contract set has reached Party A'},
    {at: 1, fn: "JSON.stringify(s.order) === JSON.stringify(['doc-sent','doc-received','clause-placed','set-sent','set-received']) && s.finalState === 'clause-linked' && s.placement === 'linked' && s.finalShown === 1 && s.layoutOk", label: 'hold: the supplied order; clause linked as supplied, nothing concluded'},
    {at: 0.3, fn: "s.stationsShown === 1 && s.finalShown === 0 && s.slipOn === 'document'", label: 'seeking back: the slip and the final state follow the time only'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.finalState === 'external-text' && s.placement === 'external' && s.slipOn === 'document' && s.whereP === 'B' && s.whereR === 'B'", label: 'alternative: external text as supplied — the slip stays in the auxiliary document'},
    {at: 0.47, params: P('contrast-or-alternative'), fn: "s.slipOn === 'document' && !s.slipHand", label: 'alternative: no hand moves the slip'},
    {at: 1, params: P('long-labels-stress'), fn: "s.slipOn === 'set' && s.layoutOk", label: 'stress: long labels; the slip in the contract set'},
    {at: 1, params: {sequence: [{event: 'doc-sent', time: 'Day 1, 10:00 (fictional)'}, {event: 'doc-received', time: 'Day 1, 10:01 (fictional)', position: 2}, {event: 'clause-placed', time: 'Clause linked (as supplied)', position: 2}, {event: 'set-sent', time: 'Day 1, 10:05 (fictional)'}, {event: 'set-received', time: 'Day 1, 10:06 (fictional)'}]}, fn: "s.grouped && s.slipOn === 'set'", label: 'a shared position: the receipt and the clause station as an order to be examined'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.whereR === 'A' && s.slipOn === 'document'", label: 'actionProgress freezes the action part-way'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.whereP === 'B' && s.whereR === 'B' && s.slipOn === 'set'", label: 'labels hidden: the same journeys and the same slip hand-over'},
  ],
});

ratioChecks(ID, 'layout fits, reach and flights stay apart', [
  {at: times(0, 1, 0.05), fn: 's.allReached', label: 'every hand reaches its target'},
  {at: [1], fn: 's.layoutOk && s.flightGap >= 0', label: 'layout fits; the two documents never meet'},
  {at: [0.47], fn: "s.placement !== 'linked' || s.slipHand", label: 'Party B\'s hand carries the slip wherever it passes'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.document.reference, p.document.title, p.clause.label + ' ' + p.clause.value, p.contractSet.reference, p.contractSet.title, ...p.sequence.map(e => e.time), ...p.parties.map(q => q.name), p.objectLabels.outgoing, p.objectLabels.incoming, ...p.annotations.map(a => a.text)]",
  content: "return [p.document.title, p.clause.label + ' ' + p.clause.value, p.contractSet.title, ...p.sequence.map(e => e.time)]",
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
noIncorporationRuleWords(ID);
conceptNeutral(ID);
docSize(ID, {cards: '^card-[pr]$', times: [0, 0.4, 0.55, 1]});
const SEQ = st => [{event: 'doc-sent', time: 'Day 1, 10:00 (fictional)'}, {event: 'doc-received', time: 'Day 1, 10:01 (fictional)'}, {event: 'clause-placed', time: st === 'clause-linked' ? 'Clause linked (as supplied)' : 'External text (as supplied)'}, {event: 'set-sent', time: 'Day 1, 10:05 (fictional)'}, {event: 'set-received', time: 'Day 1, 10:06 (fictional)'}];
const withConfig = (base, st) => ({...base, finalState: st, sequence: (base.sequence || SEQ(st)).map(e => (e.event === 'clause-placed' ? {...e, time: st === 'clause-linked' ? 'Clause linked (as supplied)' : 'External text (as supplied)'} : e))});
configNeutral(ID, [
  [withConfig({}, 'clause-linked'), withConfig({}, 'external-text')],
  [withConfig(P('contrast-or-alternative'), 'clause-linked'), P('contrast-or-alternative')],
], ['']);

// The supplied parameters of every preset carry no banned wording either (EN and ES); the configuration words appear
// only in the exact supplied labels.
test(`${ID}: no preset supplies incorporation-rule, outcome or obligation wording (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) {
    expect(JSON.stringify(pr.params).match(INCORPORATION_BANNED), pr.name).toBeNull();
    for (const e of pr.params.sequence || []) if (LINK_LABEL.test(e.time)) expect(e.time, pr.name).toMatch(/^(Cláusula vinculada \(según lo aportado\)|Clause linked \(as supplied\))$/);
  }
});

// The banned-word list itself catches the wording it must catch (EN and ES) and passes the motif's own wording; the
// label rule catches "vinculante" and passes only the exact supplied label.
test(`${ID}: the banned-word list catches rule and outcome wording and passes the supplied wording`, () => {
  for (const w of ['incorporated', 'Clause incorporated', 'incorporada', 'cláusula incorporada al contrato', 'binding', 'vinculante', 'enforceable', 'exigible', 'valid', 'válido', 'reasonable notice', 'aviso razonable', 'sufficient notice', 'aviso suficiente', 'unfair', 'abusiva', 'battle of the forms', 'batalla de los formularios', 'course of dealing', 'curso de los negocios', 'signature rule', 'must', 'debe', 'required', 'obligatorio', 'agreed', 'acordado', 'accepted', 'aceptada', 'part of the contract', 'forma parte del contrato']) expect(w, w).toMatch(INCORPORATION_BANNED);
  for (const w of ['Clause linked (as supplied)', 'Cláusula vinculada (según lo aportado)', 'External text (as supplied)', 'Texto externo (según lo aportado)', 'Clause 7 (supplied text)', 'Cláusula 7 (texto aportado)', 'Auxiliary document (fictional)', 'Documento auxiliar (ficticio)', 'Contract set (fictional)', 'Conjunto contractual (ficticio)', 'As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión', 'Hoja de cláusula', 'Clause slip']) expect(w, w).not.toMatch(INCORPORATION_BANNED);
  expect('vinculante').toMatch(LINK_LABEL);
  expect('vinculante').toMatch(INCORPORATION_BANNED);
  expect('Cláusula vinculada (según lo aportado)').not.toMatch(INCORPORATION_BANNED);
});

// The clause station is reached before the slip moves, and the slip lies in the contract set before the set leaves, in
// every preset and ratio (the cause precedes the effect; 'external text' never moves it).
test(`${ID}: the slip moves only after the clause station and before the contract set leaves (every preset × ratio)`, async ({page}) => {
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
      let stationAt = null, movedAt = null, inSetAt = null, leftAt = null, linked = null;
      for (let k = 0; k <= 200; k++) {
        x.seek((k / 200) * x.durationMs);
        const s = x.getState({bounds: false}).semantic;
        linked = s.placement === 'linked';
        if (stationAt === null && s.stationsShown >= 3) stationAt = k;
        if (movedAt === null && s.slipOn !== 'document') movedAt = k;
        if (inSetAt === null && s.slipOn === 'set') inSetAt = k;
        if (leftAt === null && s.whereR !== 'A') leftAt = k;
      }
      if (!linked) { if (movedAt !== null) fails.push(`${pr.name} ${ratio}: external text, yet the slip moved`); }
      else if ([stationAt, movedAt, inSetAt, leftAt].includes(null)) fails.push(`${pr.name} ${ratio}: missing ${stationAt} ${movedAt} ${inSetAt} ${leftAt}`);
      else if (!(stationAt < movedAt && inSetAt < leftAt)) fails.push(`${pr.name} ${ratio}: station ${stationAt} · moved ${movedAt} · in set ${inSetAt} · set left ${leftAt}`);
      x.destroy();
      el.remove();
    }
    return fails;
  }, [ID, presets]);
  expect(out).toEqual([]);
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

// The clause station's supplied label and the supplied configuration never contradict each other: every preset (and the
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
    const both = t => /(clause linked|cláusula vinculada)/i.test(t) && /(external text|texto externo)/i.test(t);
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
    const x = def.create(el, {width: 1920, height: 1080, params: {finalState: 'external-text'}});
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
  const presets = [{name: 'default', params: {annotations: [{target: 'document', text: 'Party A\'s document, as supplied'}, {target: 'sequence', text: 'Order as supplied'}]}}, ...presetsFor(ID)];
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
