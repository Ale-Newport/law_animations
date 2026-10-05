// LAW-0489 — Obligaciones recíprocas · story. Contract battery + ID-specific checks.
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// clauses (the performances stand for the clauses: performancesA / performancesB), schedules, definitions and
// priorities (no priority between the columns is drawn: neither side is primary). The motif's core content — the two
// columns, their supplied performances, the links and the hold configuration — stays editable (test-comment note only).
// No stress field is capped.
// acceptanceCheck (brief): continuity of the motion (60 fps, every tracked point — both hands and the cards), anchored
// objects (each card leaves its party's tray in that party's solved hand and is seated in that party's column; the hand
// grips the card's outer end) and a transformation recognisable with the labels hidden (the cards seat, the links draw
// on: semantic state). The cause precedes the visible effect: the links draw only once every card is seated.
// Legal content (high risk): A and B have equal weight, size and timing (the same cards, the same motion mirrored at the
// same time, ● and ◆ of the same area); a link means only "linked as supplied" (noReciprocalRuleWords, EN and ES,
// rendered and in the presets); no jurisdiction (conceptNeutral); the key reads "As supplied · no conclusion drawn".
// Windows (LAW-0489.js): passes 0.16–0.47 (n rows: one pass per row, both parties at once) · links 0.50–0.68 · final
// state 0.75–0.80 · key 0.78–0.83 · notes 0.80–0.85.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, noReciprocalRuleWords, peopleNeutral, conceptNeutral, TERM_BANNED, CONFIG_WORDS, CONFIG_LABELS, noOneWordLines, noLoneLetterSplit, noTornNumberUnit, esAportadoAgrees, docSize} from './ct03-rendered.js';

const ID = 'LAW-0489';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['handA', 'handB', 'cardA0', 'cardB0', 'cardA1', 'cardB1'],
  semantic: [
    {at: 0, fn: 's.seatedA === 0 && s.seatedB === 0 && s.linkProgress === 0 && s.finalShown === 0', label: 'rest: every card in its party\'s tray; no link'},
    {at: 0.3, fn: 's.seatedA === s.seatedB && s.seatedA >= 1 && s.linkProgress === 0', label: 'both parties seat their cards at the same time (equal timing)'},
    {at: 0.49, fn: 's.seatedA === 2 && s.seatedB === 2 && s.linkProgress === 0', label: 'every card seated before any link draws (cause before effect)'},
    {at: 0.6, fn: 's.linkProgress > 0 && s.linkProgress < 1', label: 'the links draw on'},
    {at: 1, fn: "s.links === 2 && s.linkProgress === 1 && s.finalState === 'linked' && s.finalShown === 1 && s.keyShown === 1 && s.layoutOk && s.allReached", label: 'hold: the supplied links drawn; linked as supplied; key'},
    {at: 0.2, fn: 's.linkProgress === 0 && s.finalShown === 0', label: 'seeking back: links and the final state follow the time only'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.finalState === 'listed' && s.links === 0 && s.seatedA === 3 && s.seatedB === 2", label: 'alternative: listed side by side as supplied — no link drawn'},
    {at: 1, params: P('long-labels-stress'), fn: 's.links === 3 && s.linkProgress === 1 && s.seatedA === 3 && s.seatedB === 3 && s.layoutOk', label: 'stress: three rows each, three links'},
    {at: 1, params: {actionProgress: 0.3}, fn: 's.seatedA < 2 && s.linkProgress === 0', label: 'actionProgress freezes the action part-way'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: 's.seatedA === 2 && s.seatedB === 2 && s.linkProgress === 1', label: 'labels hidden: the same seating and links'},
  ],
});

ratioChecks(ID, 'layout fits, reach, equal timing', [
  {at: times(0, 1, 0.05), fn: 's.allReached', label: 'every hand reaches its target'},
  {at: [1], fn: 's.layoutOk', label: 'layout fits'},
  {at: times(0.16, 0.5, 0.02), fn: 'Math.min(s.seatedA, P.performancesA.length) === Math.min(s.seatedB, P.performancesA.length) || Math.min(s.seatedA, P.performancesB.length) === Math.min(s.seatedB, P.performancesB.length)', label: 'both parties seat their i-th cards at the same time'},
  {at: [0.49], fn: 's.seatedA === P.performancesA.length && s.seatedB === P.performancesB.length && s.linkProgress === 0', label: 'every card seated before the links'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title, p.columns.a, p.columns.b, ...p.performancesA, ...p.performancesB, ...p.parties.map(q => q.name), p.objectLabels.a, p.objectLabels.b, ...p.annotations.map(a => a.text)]",
  content: "return [p.columns.a, p.columns.b, ...p.performancesA, ...p.performancesB]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
noTextOverProps(ID, ['[data-node^="card-"][data-node$="0"]', '[data-node^="card-"][data-node$="1"]', '[data-node^="card-"][data-node$="2"]', '[data-node="A-head"]', '[data-node="B-head"]']);
seekHistory(ID);
fill(ID, [0.05, 1], {short: 0.5});
headFloor(ID, {floors: Object.fromEntries(['default', 'baseline-illustrative', 'contrast-or-alternative', 'baseline-es'].flatMap(n => [[`${n}|1:1`, 55], [`${n}|16:9`, 60], [`${n}|9:16`, 60]]))});
esDefaults(ID);
noReciprocalRuleWords(ID);
conceptNeutral(ID);
docSize(ID, {cards: '^card-[ab]\\d-in$', times: [0, 0.4, 1], floor: 70});
peopleNeutral(ID, [[{finalState: 'linked'}, {finalState: 'listed'}], [P('contrast-or-alternative'), {...P('contrast-or-alternative'), finalState: 'linked', links: [{a: 1, b: 1}]}]], ['']);

// The supplied parameters of every preset carry no banned wording either (EN and ES); the configuration words appear
// only in the exact supplied labels.
test(`${ID}: no preset supplies rule, conclusion or exchange wording (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) {
    expect(JSON.stringify(pr.params).match(TERM_BANNED), pr.name).toBeNull();
    expect(JSON.stringify(pr.params).match(CONFIG_WORDS), pr.name).toBeNull();
  }
});

// The banned-word list itself catches the wording it must catch (EN and ES) and passes the motif's own wording.
test(`${ID}: the banned-word list catches rule and conclusion wording and passes the supplied wording`, () => {
  for (const w of ['breach', 'Breach of contract', 'incumplimiento', 'exceptio non adimpleti contractus', 'condition', 'subject to the condition', 'condición', 'must perform first', 'A must perform', 'debe cumplir primero', 'remedy', 'remedio', 'termination', 'resolución del contrato', 'damages', 'daños', 'due', 'exigible', 'binding', 'vinculante', 'valid', 'válido', 'consideration', 'contraprestación', 'outcome', 'in exchange for', 'a cambio de', 'law', 'ley']) expect(w, w).toMatch(TERM_BANNED);
  for (const w of [...CONFIG_LABELS, 'Performance A1 (supplied text)', 'Prestación A1 (texto aportado)', 'Obligation of A', 'Obligación de B', 'Contract (fictional)', 'Contrato (ficticio)', 'As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión', 'Tray A', 'Bandeja B', 'Inés Robles · Party A', 'Links as supplied (no order shown)']) expect(w, w).not.toMatch(TERM_BANNED);
  for (const w of CONFIG_LABELS) expect(w).toMatch(CONFIG_WORDS);
});

// Rendered: every drawn link starts on its A card's port (●) and ends on its B card's port (◆), at least 3 px thick, at
// the hold — every preset × ratio × labels.
test(`${ID}: each link joins its two ports, solid and thick enough to read (rendered)`, async ({page}) => {
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
      const svg = x.element;
      const k = 1080 / Math.min(w, h) * (w / svg.getBoundingClientRect().width);
      const q = nm => svg.querySelector(`[data-node="${nm}"]`);
      const end = (pth, at) => { const m = pth.getScreenCTM(); const p0 = pth.getPointAtLength(at); return new DOMPoint(p0.x, p0.y).matrixTransform(m); };
      const ctr = e => { const b = e.getBoundingClientRect(); return {x: b.left + b.width / 2, y: b.top + b.height / 2}; };
      for (let j = 0; q(`link${j}`); j++) {
        n++;
        const a = q(`link${j}-a`), b = q(`link${j}-b`);
        const pa = ctr(q(`link${j}-pa`)), pb = ctr(q(`link${j}-pb`));
        const a0 = end(a, 0), b0 = end(b, 0), a1 = end(a, a.getTotalLength()), b1 = end(b, b.getTotalLength());
        if (Math.hypot(a0.x - pa.x, a0.y - pa.y) * k > 3) fails.push(`${pr.name} ${ratio} ${tv} link${j}: does not start on the ● port`);
        if (Math.hypot(b0.x - pb.x, b0.y - pb.y) * k > 3) fails.push(`${pr.name} ${ratio} ${tv} link${j}: does not end on the ◆ port`);
        if (Math.hypot(a1.x - b1.x, a1.y - b1.y) * k > 2) fails.push(`${pr.name} ${ratio} ${tv} link${j}: halves do not meet`);
        if (a.getAttribute('stroke-dasharray') && parseFloat(a.getAttribute('stroke-dashoffset')) > 0.5) fails.push(`${pr.name} ${ratio} ${tv} link${j}: not fully drawn`);
        const sw = parseFloat(a.getAttribute('stroke-width')) * a.getScreenCTM().a * k;
        if (sw < 3) fails.push(`${pr.name} ${ratio} ${tv} link${j}: ${sw.toFixed(2)} px thin`);
        if (a.getAttribute('marker-end') || b.getAttribute('marker-end')) fails.push(`${pr.name} ${ratio} ${tv}: arrowhead`);
      }
      x.destroy();
      el.remove();
    }
    return {fails, n};
  }, [ID, presets]);
  expect(out.n).toBeGreaterThan(10);
  expect(out.fails).toEqual([]);
});

// Rendered: A and B at equal weight — the two columns, every card and the ●/◆ glyphs have the same size; the two
// people the same figure scale — at rest and at the hold, every preset × ratio.
test(`${ID}: obligation A and obligation B at equal weight (rendered)`, async ({page}) => {
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
      x.seek(x.durationMs);
      const B = n => { const e = x.element.querySelector(`[data-node="${n}"]`); return e ? e.getBoundingClientRect() : null; };
      const same = (a, b, tag) => { if (a && b && (Math.abs(a.width - b.width) > 1 || Math.abs(a.height - b.height) > 1)) fails.push(`${pr.name} ${ratio} ${tag}: ${a.width.toFixed(0)}×${a.height.toFixed(0)} vs ${b.width.toFixed(0)}×${b.height.toFixed(0)}`); };
      same(B('col-a'), B('col-b'), 'columns');
      same(B('card-a0-in-sheet'), B('card-b0-in-sheet'), 'cards');
      const ka = x.element.querySelector('[data-node="A"]').getAttribute('transform'), kb = x.element.querySelector('[data-node="B"]').getAttribute('transform');
      const sc = t => Math.abs(parseFloat((t.match(/scale\(([-0-9.]+)/) || [])[1]));
      if (Math.abs(sc(ka) - sc(kb)) > 1e-6) fails.push(`${pr.name} ${ratio}: people scales ${ka} vs ${kb}`);
      const ga = x.element.querySelector('[data-node="card-a0-in"] circle'), gb = x.element.querySelector('[data-node="card-b0-in"] path[stroke-linejoin="round"]');
      if (ga && gb) {
        const ra = ga.getBoundingClientRect(), rb = gb.getBoundingClientRect();
        const areaA = Math.PI * (ra.width / 2) ** 2, areaB = rb.width * rb.height / 2;
        if (Math.abs(areaA - areaB) / areaA > 0.08) fails.push(`${pr.name} ${ratio}: ● ${areaA.toFixed(0)} vs ◆ ${areaB.toFixed(0)} px²`);
      }
      x.destroy();
      el.remove();
    }
    return fails;
  }, [ID, presets]);
  expect(out).toEqual([]);
});

// 60 fps, every preset × ratio × labels: a card never moves without its party's hand on it. Whenever a card moves, the
// semantic names it as held by that party's near hand, the hand is at the held grip (≤ 2 design units: the card's outer
// end beside the board; the lifter's foot under it at 9:16) and the hand stays at a constant offset from the card (± 2
// units over the whole hold; beside the board the hand may slide along the card's outer end, never off it — review
// ct03: the 9:16 cards rose 270 units with the hand back at rest). Both arms
// of both people stay clear of their heads at every frame (review ct03, AUTHORING item 6: raised forearms across the
// faces at 9:16).
test(`${ID}: every moving card is held by its party's hand at a constant distance; arms never cross a face (60 fps, rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, {name: 'es-only', params: {locale: 'es'}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let moves = 0, lifter = 0;
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) for (const tv of ['all', 'none']) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const tag = `${pr.name} ${ratio} ${tv}`;
      let prev = null, prevHeld = null;
      const d0 = {};
      for (let t = 0; t <= x.durationMs + 1e-6; t += 1000 / 60) {
        x.seek(t);
        const s = x.getState({bounds: false}).semantic;
        if (s.lifter) lifter++;
        if (!s.armsClear) fails.push(`${tag} t${Math.round(t)}: an arm crosses a face`);
        if (!s.allReached) fails.push(`${tag} t${Math.round(t)}: a hand out of reach`);
        for (const S of ['A', 'B']) {
          const hand = s[`hand${S}`], held = s[`held${S}`];
          for (let i = 0; s[`card${S}${i}`]; i++) {
            const c = s[`card${S}${i}`];
            const key = `${S}${i}`;
            if (prev && Math.hypot(c.x - prev[key].x, c.y - prev[key].y) > 0.3) {
              moves++;
              // (the last step of a seat lands in the frame after the hand's release: the hold of either frame counts)
              const ph = prevHeld && prevHeld[S];
              const hd = held && held.i === i ? held : ph && ph.i === i ? ph : null;
              if (hd && hd !== held) continue;
              if (!hd) { fails.push(`${tag} t${Math.round(t)}: card ${key} moves with no hand on it`); continue; }
              const dg = Math.hypot(hand.x - held.grip.x, hand.y - held.grip.y);
              if (dg > 2) fails.push(`${tag} t${Math.round(t)}: card ${key} moves, hand ${dg.toFixed(1)} from its grip`);
              // (the hand's offset from the card: across the card constant; along the card's end constant with the
              // lifter, and on the card's end — within its height — beside the board, where the hand holds the end)
              const ox = Math.abs(hand.x - c.x), oy = hand.y - c.y;
              if (d0[key] === undefined) d0[key] = {ox, oy};
              else if (Math.abs(ox - d0[key].ox) > 2) fails.push(`${tag} t${Math.round(t)}: card ${key} hand offset across ${ox.toFixed(1)} vs ${d0[key].ox.toFixed(1)}`);
              if (s.lifter ? Math.abs(oy - d0[key].oy) > 2 : Math.abs(oy) > s.cardH / 2) fails.push(`${tag} t${Math.round(t)}: card ${key} hand offset along ${oy.toFixed(1)} vs ${d0[key].oy.toFixed(1)}`);
            }
          }
        }
        prevHeld = {A: s.heldA, B: s.heldB};
        prev = {};
        for (const S of ['A', 'B']) for (let i = 0; s[`card${S}${i}`]; i++) prev[`${S}${i}`] = s[`card${S}${i}`];
      }
      x.destroy();
      el.remove();
    }
    return {fails, moves, lifter};
  }, [ID, presets]);
  expect(out.moves).toBeGreaterThan(500);
  expect(out.lifter).toBeGreaterThan(100);
  const seen = new Set();
  expect(out.fails.filter(f => { const k = f.replace(/ t\d+:/, ':').replace(/[-0-9.]+ vs [-0-9.]+|[0-9.]+ from/, ''); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 30)).toEqual([]);
});

// The ●/◆ glyphs (each card's own glyph and the links' port markers) stay ≥ 4 px clear of the card print at the hold,
// every preset × ratio (review ct03: the glyph touched the first letters at stress 1:1 and es 9:16).
test(`${ID}: the ●/◆ glyphs stay ≥ 4 px clear of the card print (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, {name: 'es-only', params: {locale: 'es'}}, ...presetsFor(ID)];
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
      const k = 1080 / Math.min(w, h) * (w / svg.getBoundingClientRect().width);
      const glyphs = [...svg.querySelectorAll('[data-node$="-pa"], [data-node$="-pb"]')].filter(e => parseFloat(e.getAttribute('opacity') ?? '1') > 0.5)
        .concat([...svg.querySelectorAll('[data-node$="-in"] > circle, [data-node$="-in"] > path[stroke-linejoin]')]);
      for (const gl of glyphs) {
        const gb = gl.getBoundingClientRect();
        for (const t of svg.querySelectorAll('[data-node^="card-"] text')) {
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
  }, [ID, presets]);
  expect(out.n).toBeGreaterThan(50);
  expect(out.fails).toEqual([]);
});

// How wrapped text breaks (every preset + es-only × ratio, u step 0.05): no one-word line, no lone letter or ID split
// from its word, no number torn from its unit, and no Spanish "(aportado)" after a feminine or plural word.
noOneWordLines(ID);
noLoneLetterSplit(ID);
noTornNumberUnit(ID);
esAportadoAgrees(ID);
