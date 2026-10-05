// LAW-0477 — Aceptación digital · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (60 fps, every tracked point), anchored objects (each device leaves
// its giver's rack from the giver's solved hand and lands at the other party's solved hand) and a transformation
// recognisable with the labels hidden (semantic state only). The cause precedes the visible effect: the screen shows
// its terms only once it rests at Party B, and the action device is sent — and recorded — only after the terms are
// shown.
// Legal content (very high risk): the rows are generic placeholders ("Term 1 (supplied text)"), never real terms; the
// user's action is only "Action recorded (as supplied)"; "presentation to be examined" is a supplied, pending question
// only — a grey dashed outline inside the indicated device, never a finding, a deficiency or a warning; no rule on online
// acceptance, consent, enforceability or validity (noAcceptanceRuleWords, EN and ES, rendered and in the presets); no
// jurisdiction (conceptNeutral); the key reads "As supplied · no conclusion drawn".
// Windows (LAW-0477.js): events at 0.24 · 0.35 · 0.46 (terms shown) · 0.57 · 0.68 · the screen opens 0.455–0.505 · the
// pending outline 0.495–0.52 · the action device opens 0.675–0.72 · final state 0.75–0.80 · key 0.78–0.83 · notes
// 0.80–0.85.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {stepConnector, textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, cardsApart, noAcceptanceRuleWords, pendingNeutral, conceptNeutral, ACCEPTANCE_BANNED, noOneWordLines, noLoneLetterSplit, noTornNumberUnit, esAportadoAgrees} from './cf10-rendered.js';

const ID = 'LAW-0477';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ROW = "(String(t.value).startsWith('(') ? t.label + ' ' + t.value : t.label + ': ' + t.value)";

contractSuite(ID, {
  continuity: ['handA', 'handB', 'cardP', 'cardR'],
  semantic: [
    {at: 0, fn: "s.whereP === 'A' && s.whereR === 'A' && s.stationsShown === 0 && s.connected === 0 && s.recorded === 0", label: 'rest: each device closed in its giver\'s rack; the strip is empty'},
    {at: 0.3, fn: "s.whereP === 'route' && s.whereR === 'A' && s.stationsShown === 1", label: 'Party A\'s screen sets off first (supplied order); one station'},
    {at: 0.42, fn: "s.whereP === 'B' && s.whereR === 'A' && s.connected === 0 && s.stationsShown === 2", label: 'the screen rests at Party B before it shows its terms (cause before effect)'},
    {at: 0.53, fn: "s.connected === 1 && s.whereR === 'A' && s.recorded === 0 && s.stationsShown === 3", label: 'the terms are shown before any action'},
    {at: 0.62, fn: "s.whereR === 'route' && s.connected === 1 && s.recorded === 0", label: 'the action device travels after the terms are shown'},
    {at: 0.76, fn: "s.recorded === 1 && s.stationsShown === 5 && s.allReached", label: 'the action is recorded, as supplied'},
    {at: 1, fn: "JSON.stringify(s.order) === JSON.stringify(['screen-sent','screen-received','terms-shown','action-sent','action-received']) && s.finalState === 'action-recorded' && s.finalShown === 1 && !s.pending && s.layoutOk", label: 'hold: the supplied order; the action recorded as supplied, nothing concluded'},
    {at: 0.3, fn: 's.stationsShown === 1 && s.finalShown === 0 && s.connected === 0 && s.recorded === 0', label: 'seeking back: the terms, the record and the final state follow the time only'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.finalState === 'presentation-to-examine' && s.pending && s.pendingParty === 'A' && s.connected === 1 && s.recorded === 1", label: 'alternative: presentation to be examined as supplied (the outline on A\'s screen)'},
    {at: 1, params: P('long-labels-stress'), fn: "s.connected === 1 && s.recorded === 1 && s.pendingParty === 'A' && s.layoutOk", label: 'stress: long labels; both devices open'},
    {at: 1, params: {sequence: [{event: 'screen-sent', time: 'Day 1, 10:00 (fictional)'}, {event: 'screen-received', time: 'Day 1, 10:01 (fictional)', position: 2}, {event: 'terms-shown', time: 'Terms shown (as supplied)', position: 2}, {event: 'action-sent', time: 'Day 1, 10:05 (fictional)'}, {event: 'action-received', time: 'Day 1, 10:06 (fictional)'}]}, fn: "s.grouped && s.connected === 1 && s.recorded === 1", label: 'a shared position: the receipt and the terms shown as an order to be examined'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.whereR === 'A' && s.connected === 0", label: 'actionProgress freezes the action part-way'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.whereP === 'B' && s.whereR === 'B' && s.connected === 1 && s.recorded === 1", label: 'labels hidden: the same journeys, the same terms shown and the same record'},
  ],
});

ratioChecks(ID, 'layout fits, reach and flights stay apart', [
  {at: times(0, 1, 0.05), fn: 's.allReached', label: 'every hand reaches its target'},
  {at: [1], fn: 's.layoutOk && s.flightGap >= 0', label: 'layout fits; the two devices never meet'},
]);

suppliedTextSuite(ID, {
  fields: `return [p.offer.reference, p.offer.title, ...p.terms.map(t => ${ROW}), p.responses[0].reference, p.responses[0].text, ...p.termsB.map(t => ${ROW}), ...p.sequence.map(e => e.time), ...p.parties.map(q => q.name), p.objectLabels.outgoing, p.objectLabels.incoming, ...p.annotations.map(a => a.text)]`,
  content: `return [p.offer.title, ...p.terms.map(t => ${ROW}), p.responses[0].text, ...p.termsB.map(t => ${ROW}), ...p.sequence.map(e => e.time)]`,
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
noTextOverProps(ID, ['[data-node="card-p"]', '[data-node="card-r"]', '[data-node="A-head"]', '[data-node="B-head"]']);
seekHistory(ID);
fill(ID, [0.05, 1], {short: 0.5});
headFloor(ID);
esDefaults(ID);
cardsApart(ID, [['card-p', 'card-r']]);
noAcceptanceRuleWords(ID);
conceptNeutral(ID);
// (pairs that differ only in the supplied status — the terms-shown station's label agrees with each)
const SEQ = [{event: 'screen-sent', time: 'Day 1, 10:00 (fictional)'}, {event: 'screen-received', time: 'Day 1, 10:01 (fictional)'}, {event: 'terms-shown', time: ''}, {event: 'action-sent', time: 'Day 1, 10:05 (fictional)'}, {event: 'action-received', time: 'Day 1, 10:06 (fictional)'}];
const withStatus = (base, st, label) => ({...base, finalState: st, sequence: (base.sequence || SEQ).map(e => (e.event === 'terms-shown' ? {...e, time: label} : e))});
pendingNeutral(ID, [
  [withStatus({}, 'action-recorded', 'Terms shown (as supplied)'), withStatus({}, 'presentation-to-examine', 'Presentation to be examined (as supplied)')],
  [withStatus(P('contrast-or-alternative'), 'action-recorded', 'Terms shown (as supplied)'), P('contrast-or-alternative')],
], [''], ['A', 'B'], {figClear: true});

// The supplied parameters of every preset carry no banned wording either (EN and ES).
test(`${ID}: no preset supplies online-acceptance rule, outcome, consent or obligation wording (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) expect(JSON.stringify(pr.params).match(ACCEPTANCE_BANNED), pr.name).toBeNull();
});

// The banned-word list itself catches the wording it must catch (EN and ES) and passes the motif's own wording.
test(`${ID}: the banned-word list catches rule and outcome wording and passes the supplied wording`, () => {
  for (const w of ['binding', 'vinculante', 'enforceable', 'exigible', 'valid', 'válido', 'consent given', 'consentimiento prestado', 'agreed', 'acordado', 'accepted', 'aceptado', 'clickwrap', 'browsewrap', 'conspicuous', 'insufficient', 'insuficiente', 'unfair', 'abusiva', 'must', 'debe', 'required', 'obligatorio', 'GDPR', 'RGPD']) expect(w, w).toMatch(ACCEPTANCE_BANNED);
  for (const w of ['Action recorded (as supplied)', 'Acción registrada (según lo aportado)', 'Presentation to be examined (as supplied)', 'Presentación por examinar (según lo aportado)', 'Terms shown (as supplied)', 'Términos mostrados', 'Term 1 (supplied text)', 'Término 1 (aportado)', 'Button: generic', 'Botón: genérico']) expect(w, w).not.toMatch(ACCEPTANCE_BANNED);
});

// The terms are shown before the action is recorded, in every preset and ratio (the cause precedes the effect).
test(`${ID}: the screen shows its terms before the action device leaves and is recorded (every preset × ratio)`, async ({page}) => {
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
      let shownAt = null, leftAt = null, recAt = null;
      for (let k = 0; k <= 200; k++) {
        x.seek((k / 200) * x.durationMs);
        const s = x.getState({bounds: false}).semantic;
        if (shownAt === null && s.connected >= 1) shownAt = k;
        if (leftAt === null && s.whereR !== 'A') leftAt = k;
        if (recAt === null && s.recorded > 0) recAt = k;
      }
      if (shownAt === null || leftAt === null || recAt === null) fails.push(`${pr.name} ${ratio}: missing ${shownAt} ${leftAt} ${recAt}`);
      else if (!(shownAt < leftAt && leftAt < recAt)) fails.push(`${pr.name} ${ratio}: shown ${shownAt} · left ${leftAt} · recorded ${recAt}`);
      x.destroy();
      el.remove();
    }
    return fails;
  }, [ID, presets]);
  expect(out).toEqual([]);
});

// Rendered: the pending outline comes with the terms-shown station, inside the indicated device only, and leaves on
// seeking back.
test(`${ID}: the pending outline follows the terms-shown station, lies on the indicated device and clears both people (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const fails = [];
    for (const party of ['A', 'B']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {finalState: 'presentation-to-examine', pendingParty: party, sequence: [
        {event: 'screen-sent', time: 'Day 1, 10:00 (fictional)'}, {event: 'screen-received', time: 'Day 1, 10:01 (fictional)'},
        {event: 'terms-shown', time: 'Presentation to be examined (as supplied)'},
        {event: 'action-sent', time: 'Day 1, 10:05 (fictional)'}, {event: 'action-received', time: 'Day 1, 10:06 (fictional)'}]}});
      await x.ready;
      const ring = () => x.element.querySelector('[data-node="pend"]');
      const op = e => { let o = 1; for (let q = e; q && q !== x.element; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
      x.seek(0.44 * x.durationMs);
      if (!ring() || op(ring()) > 0.01) fails.push(`${party} ${ratio}: outline before the terms-shown station`);
      x.seek(x.durationMs);
      const b = ring().getBoundingClientRect(), c = x.element.querySelector(`[data-node="card-${party === 'A' ? 'p' : 'r'}-face"]`).getBoundingClientRect();
      if (op(ring()) < 0.99) fails.push(`${party} ${ratio}: outline not shown at the hold`);
      // (the outline runs just inside the device's bezel: it lies on the indicated device)
      if (!(b.left >= c.left - 1 && b.right <= c.right + 1 && b.top >= c.top - 1 && b.bottom <= c.bottom + 1)) fails.push(`${party} ${ratio}: outline not on the indicated device`);
      // (from its first frame to the hold the outline clears each person's whole outline, hair and arms included)
      for (let k = 48; k <= 100; k++) {
        x.seek((k / 100) * x.durationMs);
        if (op(ring()) < 0.05) continue;
        const rb = ring().getBoundingClientRect();
        for (const f of ['A', 'B']) { const q = x.element.querySelector(`[data-node="${f}"]`).getBoundingClientRect(); if (rb.left < q.right + 2 && rb.right > q.left - 2 && rb.top < q.bottom + 2 && rb.bottom > q.top - 2) fails.push(`${party} ${ratio} u${k / 100}: outline touches person ${f}`); }
      }
      x.seek(0.3 * x.durationMs);
      if (op(ring()) > 0.01) fails.push(`${party} ${ratio}: outline after seeking back`);
      x.destroy();
      el.remove();
    }
    return fails;
  }, ID);
  expect(out).toEqual([]);
});

// Rendered: the two devices at equal weight — the same size, in every preset × ratio at rest.
test(`${ID}: the two devices at equal weight (rendered)`, async ({page}) => {
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
      const box = n => x.element.querySelectorAll(`[data-node="${n}-face"] > path`)[1].getBoundingClientRect();
      const a = box('card-p'), b = box('card-r');
      if (Math.abs(a.width - b.width) > 1 || Math.abs(a.height - b.height) > 1) fails.push(`${pr.name} ${ratio}: cards ${a.width.toFixed(0)}×${a.height.toFixed(0)} vs ${b.width.toFixed(0)}×${b.height.toFixed(0)}`);
      x.destroy();
      el.remove();
    }
    return fails;
  }, [ID, presets]);
  expect(out).toEqual([]);
});

// The terms-shown station's supplied label and the supplied final state never contradict each other: every preset
// (and the defaults) is consistent, the module flags a contradiction (a presentation to be examined whose station says
// the terms were shown: layoutOk false), and at the hold no rendered text names both presentation statuses (labels on,
// every ratio).
test(`${ID}: the station label and the final state cannot contradict (presets, flag, rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, {name: 'default-es', params: {locale: 'es'}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    const both = t => /(terms shown|términos mostrados)/i.test(t) && /(to be examined|por examinar)/i.test(t);
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
      if (both(txt)) fails.push(`${pr.name} ${ratio}: both statuses rendered`);
      x.destroy();
      el.remove();
    }
    // a contradicting supplied pair is flagged
    const el = document.createElement('div');
    document.getElementById('slots').appendChild(el);
    const x = def.create(el, {width: 1920, height: 1080, params: {finalState: 'presentation-to-examine'}});
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
  const presets = [{name: 'default', params: {annotations: [{target: 'screen', text: 'Party A\'s screen, as supplied'}, {target: 'sequence', text: 'Order as supplied'}]}}, ...presetsFor(ID)];
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
      const targets = {screen: B('card-p-face'), action: B('card-r-face'), sequence: stations};
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

// Rendered: the scroll rail of each device (the concrete action "a screen shows terms before a user action is recorded")
// — hidden before the device opens (the screen at the terms-shown station, the action device at its receipt), anchored
// to its rows at the hold.
stepConnector(ID, [['card-p', 'terms', 0.44], ['card-r', 'termsB', 0.62]]);

// How wrapped text breaks (every preset + es-only × ratio, u step 0.05): no one-word line, no lone letter or ID split
// from its word, no number torn from its unit, and no Spanish "(aportado)" after a feminine or plural word.
noOneWordLines(ID);
noLoneLetterSplit(ID);
noTornNumberUnit(ID);
esAportadoAgrees(ID);
