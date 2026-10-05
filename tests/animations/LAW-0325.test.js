// LAW-0325 — Ruta de recurso · story. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): continuity of the motion (the sheet, the participant and its hand move continuously), the
// anchoring of objects (the hands are on the sheet's lower edge whenever it is off a tray; the sheet rests in trays; every
// route line starts and ends on its own stations' lower edges) and the transformation recognisable with labels hidden
// (the sheet leaves the first tray, dips into every tray on the way and rests in the last one; pips number the steps).
// Timing (u): rest 0–0.15 · hands to the sheet 0.15–0.19 · lift 0.19–0.22 · carry 0.22–0.65 (every step, dipping into
// each intermediate tray) · laid 0.65–0.68 · hands let go 0.68–0.72 · the participant steps aside 0.71–0.75 · pin
// 0.74–0.78 · notes 0.75–0.80 · state tag 0.76–0.81; still from 0.81. Supplied state ◆ "not checked": the sheet stays in
// the first tray and its dashed outline (pending) traces the route over 0.19–0.65; nobody moves.
// Legal (VERY HIGH risk): abstract fictional bodies of the same size on one row (rendered equal-size / equal-baseline
// test); the route is only the supplied sequence (numbered, no arrowheads); "not checked" is a neutral pending state
// (dashed, never red, never struck); no rank, appeal rule, admissibility, time limit, leave, ground, outcome or
// jurisdiction. People floors (coordinator; review = hearings, FIGURE height): >= 60 px off 1:1, >= 55 px at 1:1;
// long-labels-stress >= 45 px at every ratio (STRESS PEOPLE FLOOR OFF 1:1).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, esSuppliedTagTest, routeConsistencyTest, equalBodiesTest, routeAnchoredTest, routeOffTextTest, glyphStateTest, noTwinTextTest, gluedNumbersTest, noOneWordLineTest, noOneSideHighlightTest, stepDiscClearTest, ES_WORDS, FLOOR_FOR} from './ruta-recurso-checks.js';

const ID = 'LAW-0325';

contractSuite(ID, {
  continuity: ['doc', 'person', 'hand'],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.phase === 'rest' && s.docAt === s.first && s.reaching === 0 && s.lift === 0 && s.pin === 0", label: 'rest: the sheet in the first body\'s tray; hands down'},
    {at: 0.145, fn: "s.phase === 'rest' && s.reaching === 0", label: 'nothing happens during the rest beat'},
    {at: 0.19, fn: 's.reaching > 0.99 && s.lift === 0 && s.docAt === s.first', label: 'the hands reach the sheet before it moves (cause before effect)'},
    {at: 0.3, fn: "s.lift === 1 && s.reaching === 1 && (s.phase === 'carrying' || s.phase === 'dipping') && s.docAt === -1", label: 'the sheet is carried, lifted, in the hands, along the route'},
    {at: 0.7, fn: 's.docAt === s.last && s.lift === 0', label: 'the sheet is laid in the last body\'s tray'},
    {at: 1, fn: "s.phase === 'laid' && s.docAt === s.last && s.reaching === 0 && s.pin === 1 && s.allReached && s.problems.length === 0", label: 'hold: the sheet in the last tray with its ● pin; hands down; the composition fits'},
    {at: 0.33, params: {textVisibility: 'none'}, fn: 's.lift === 1 && s.docAt === -1', label: 'labels hidden: the same carry'},
    {at: 1, params: {finalState: 'route-unchecked'}, fn: "s.mode === 'ghost' && s.docAt === s.first && s.ghostAt === s.last && s.reaching === 0", label: 'supplied state "not checked": the sheet stays in the first tray; its dashed outline rests in the last one'},
    {at: 0.4, params: {finalState: 'route-unchecked'}, fn: "s.docAt === s.first && s.ghost !== null && s.reaching === 0", label: '"not checked": the outline traces the route; nobody takes the sheet'},
    {at: 1, params: {actionProgress: 0.4}, fn: 's.actionCapped && s.docAt === -1', label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {routes: {bodies: [{label: 'Body A (fictional)'}, {label: 'Body B (fictional)'}, {label: 'Body C (fictional)'}], steps: [2, 0]}}, fn: 's.first === 2 && s.last === 0 && s.docAt === 0', label: 'the supplied order alone decides the direction'},
    {at: 0.1, fn: "s.phase === 'rest' && s.docAt === s.first", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [...(p.stateCaption ? [p.stateCaption] : []), p.decisions.title, p.courier.label, ...p.routes.bodies.map(b => b.label), p.outcomes.a, p.outcomes.b, p.labels.route, p.labels.sequence, p.labels.key, p.objectLabels.body, p.objectLabels.tray, p.objectLabels.calendar, ...(p.finalState === 'route-unchecked' ? [p.objectLabels.ghost] : []), ...p.annotations.map(a => a.text)];",
  content: 'return [p.decisions.title, p.courier.label, ...p.routes.bodies.map(b => b.label), p.outcomes.a, p.outcomes.b];',
  captions: 'return [p.objectLabels.body, p.objectLabels.tray, p.objectLabels.calendar, p.labels.sequence];',
});

ratioChecks(ID, 'cause before effect, the sheet only in the hands, composition fits', [
  {at: times(0, 0.75, 0.005), fn: 's.lift === 0 || s.reaching > 0.99', label: 'the sheet only moves while the hands are on it'},
  {at: times(0, 1, 0.005), fn: 's.docAt !== -1 || s.reaching > 0.99', label: 'off a tray, the sheet is always in the hands'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0', label: 'the composition fits'},
  {at: times(0.15, 0.75, 0.01), fn: 's.allReached', label: 'the hands stay within the arms\' reach'},
]);

const PROPS = ['[data-node="rm-clock"]', '[data-node="rm-sign"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: ['[data-node="rm-doc"]', '[data-node="rm-p0"]']});
noOverlapTest(ID, {markers: ['[data-node="rings"]', '[data-node^="rm-p"][data-node$="-head"]', '[data-node="rm-doc"]', '[data-node="rm-ghost"]', '[data-node="rm-sign"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {re: '^rm-p0$', floorFor: FLOOR_FOR});
// (the dashed outline is drawn UNDER the participant — the next test checks the drawing order — so it never covers a head)
headsClearTest(ID, {covers: ['[data-node="rings"] rect', '[data-node="rings"] circle', '[data-node="rm-sign"]', '[data-node="rm-doc"]', '[data-node^="rm-st"][data-node$="-plate"]']});
test(`${ID}: the dashed outline and the route are drawn under the participant; the sheet over it (document order)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const ok = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
    const x = def.create(el, {width: 1920, height: 1080, params: {finalState: 'route-unchecked'}}); await x.ready;
    const n = q => x.element.querySelector('[data-node="' + q + '"]');
    const before = (a, b) => Boolean(n(a).compareDocumentPosition(n(b)) & Node.DOCUMENT_POSITION_FOLLOWING);
    const res = [before('rm-ghost', 'rm-p0'), before('rm-route', 'rm-p0'), before('rm-steps', 'rm-p0'), before('rm-p0', 'rm-doc')];
    x.destroy(); el.remove();
    return res;
  }, ID);
  expect(ok).toEqual([true, true, true, true]);
});
armsClearTest(ID, {props: PROPS});
equalWeightTest(ID, {at: [0.1, 1], marks: [['[data-node="lg-a"] circle', '[data-node="lg-b"] path:first-of-type'], ['[data-node="rm-sign-a-d-g"]', '[data-node="rm-sign-b-d-g"]'], ['[data-node="rm-doc-pin-a-g"]', '[data-node="rm-doc-pin-b-g"]']]});
neutralityTest(ID);
bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
esSuppliedTagTest(ID);
routeConsistencyTest(ID);
equalBodiesTest(ID);
routeAnchoredTest(ID);
routeOffTextTest(ID);
glyphStateTest(ID);
noTwinTextTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.2, 0.3, 0.45, 0.5, 0.62, 0.7, 0.8, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="rm-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
textLinesVisibleTest(ID);
gluedNumbersTest(ID);
noOneWordLineTest(ID);
noOneSideHighlightTest(ID);

// The hold never contradicts the drawing (EN and ES, every preset × ratio): with ● "available" the sheet rests in the last
// body's tray, carries the ● pin, the sign shows ●, the route is drawn solid and nothing dashed is visible, and the state
// tag is the "travelled" one; with ◆ "not checked" the sheet is still in the first tray with the ◆ pin, the sign shows ◆,
// the route is drawn dashed and the outline rests in the last tray, and the legend explains the outline.
test(`${ID}: for each finalState the hold text, sign, pin, route style and sheet position agree (EN and ES, every preset × ratio)`, async ({page}) => {
  test.setTimeout(600000);
  const bad = [];
  for (const finalState of ['route-available', 'route-unchecked']) for (const locale of ['en', 'es']) {
    const {bad: b} = await forAll(page, ID, `
      const out = [];
      const tag = pr.name + ' ' + ratio + ' ' + arg.finalState + ' ' + arg.locale;
      const params = {...pr.params, finalState: arg.finalState, locale: arg.locale};
      if (arg.finalState === 'route-unchecked') delete params.stateCaption;
      if (arg.finalState === 'route-available' && pr.params.finalState === 'route-unchecked') delete params.stateCaption;
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const y = (await window.__lib.load(arg.id)).create(el, {width: w, height: h, params});
      await y.ready; y.seek(y.durationMs);
      const sv = y.element;
      const op = n => { const e = node(sv, n); return e ? eff(sv, e) : 0; };
      const s = y.getState({bounds: false}).semantic;
      const A = arg.finalState === 'route-available';
      const solid = nodes(sv, /^rm-rt\\d+$/).map(e => eff(sv, e)), dashed = nodes(sv, /^rm-rd\\d+$/).map(e => eff(sv, e));
      const tagText = node(sv, 'state-tag') ? node(sv, 'state-tag').textContent : '';
      if (A) {
        if (s.docAt !== s.last) out.push(tag + ': the sheet is not in the last tray');
        if (op('rm-doc-pin-a') < 0.95 || op('rm-doc-pin-b') > 0.05) out.push(tag + ': the pin is not ●');
        if (op('rm-sign-a') < 0.95 || op('rm-sign-b') > 0.05) out.push(tag + ': the sign is not ●');
        if (solid.some(q => q < 0.95) || dashed.some(q => q > 0.05)) out.push(tag + ': the route is not drawn solid');
        if (op('rm-ghost') > 0.05) out.push(tag + ': an outline is shown');
        if (!params.stateCaption && tagText && !/travelled|recorrió/.test(tagText)) out.push(tag + ': state tag "' + tagText + '"');
        if (node(sv, 'lg-ghost')) out.push(tag + ': the outline row is shown although no outline is drawn');
      } else {
        if (s.docAt !== s.first) out.push(tag + ': the sheet left the first tray');
        if (s.ghostAt !== s.last) out.push(tag + ': the outline is not in the last tray');
        if (op('rm-doc-pin-b') < 0.95 || op('rm-doc-pin-a') > 0.05) out.push(tag + ': the pin is not ◆');
        if (op('rm-sign-b') < 0.95 || op('rm-sign-a') > 0.05) out.push(tag + ': the sign is not ◆');
        if (dashed.some(q => q < 0.95) || solid.some(q => q > 0.05)) out.push(tag + ': the route is not drawn dashed (pending)');
        if (tagText && !/not checked|no comprobada/.test(tagText)) out.push(tag + ': state tag "' + tagText + '"');
        if (node(sv, 'state-tag') && !node(sv, 'lg-ghost') && sv.querySelector('[data-node="lg-calendar"]')) out.push(tag + ': the outline is not explained in the legend');
      }
      y.destroy(); el.remove();
      void x; void svg;
      return out;`, {finalState, locale, id: ID});
    bad.push(...b);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

// Item 18: the stations and the sheet are the acting objects — at the hold, labels shown, the row of stations spans >=
// 0.45 of the frame width at 16:9 and 9:16 (>= 0.40 at 1:1); the sheet is >= 0.045 of the frame width at 16:9 and 1:1 and
// >= 0.09 at 9:16 (four bodies, long-labels-stress: >= 0.035 / >= 0.08).
test(`${ID}: the stations and the sheet are large — rendered share of the frame width at the hold`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    svg.style.width = w + 'px'; svg.style.height = h + 'px';
    x.seek(x.durationMs);
    const F = svg.getBoundingClientRect();
    const pl = nodes(svg, /^rm-st\\d+-plate$/).map(box);
    const row = (Math.max(...pl.map(q => q.r)) - Math.min(...pl.map(q => q.l))) / F.width;
    const d = node(svg, 'rm-doc-k').getBoundingClientRect().width / F.width;
    stat('stations row share ' + ratio, Math.round(row * 1000) / 1000);
    stat('sheet share ' + ratio, Math.round(d * 1000) / 1000);
    // (four bodies in long-labels-stress: the sheet's floor is 0.035 at 16:9 and 1:1, 0.08 at 9:16)
    const st = /long-labels-stress/.test(pr.name);
    // (long-labels-stress at 16:9: four long body names fill a two-column legend beside the room — the row of stations
    // keeps >= 0.36 of the frame width there)
    const rMin = ratio === '1:1' ? 0.4 : st && ratio === '16:9' ? 0.36 : 0.45, dMin = ratio === '9:16' ? (st ? 0.08 : 0.09) : st ? 0.035 : 0.045;
    if (row < rMin) out.push(pr.name + ' ' + ratio + ': stations row ' + row.toFixed(3) + ' of the frame width < ' + rMin);
    if (d < dMin) out.push(pr.name + ' ' + ratio + ': sheet ' + d.toFixed(3) + ' of the frame width < ' + dMin);
    return out;`, {}, {withHidden: true});
  report(ID, 'acting objects share', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Nothing teleports (rendered, 60 fps): the sheet, the outline and the participant move by less than 40 px per frame; the
// right hand holds the sheet's lower edge (within 3 px) whenever the sheet is lifted; the sheet visits the trays of the
// supplied route in order (each intermediate tray is entered once, between its two steps).
test(`${ID}: the sheet moves continuously, only in the hands, through every tray of the route in the supplied order`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    let prev = null, worst = 0, off = 0;
    const visits = [];
    for (let ms = 0; ms <= x.durationMs + 1e-6; ms += 1000 / 60) {
      x.seek(ms);
      const s = x.getState({bounds: false}).semantic;
      const k = s.pxu;
      const now = [s.doc, s.person, s.ghost || s.doc];
      if (prev) now.forEach((q, i) => { worst = Math.max(worst, Math.hypot(q.x - prev[i].x, q.y - prev[i].y) * k); });
      prev = now;
      if (s.lift > 0) off = Math.max(off, Math.hypot(s.hand.x - s.grip.x, s.hand.y - s.grip.y) * k);
      const at = s.mode === 'ghost' ? s.ghostAt : s.docAt;
      if (at !== null && at >= 0 && visits[visits.length - 1] !== at) visits.push(at);
    }
    const s1 = x.getState({bounds: false}).semantic;
    stat('max move px/frame ' + ratio, Math.round(worst), 'max');
    stat('max hand-grip gap ' + ratio, Math.round(off * 10) / 10, 'max');
    if (worst > 40) out.push(tag + ': something jumps ' + Math.round(worst) + ' px in one frame');
    if (off > 3) out.push(tag + ': the hand leaves the sheet by ' + off.toFixed(1) + ' px');
    if (visits.join('>') !== s1.steps.join('>')) out.push(tag + ': trays visited ' + visits.join('>') + ' vs the route ' + s1.steps.join('>'));
    return out;`, {}, {withHidden: true});
  report(ID, 'continuity', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// The action is recognisable with the labels hidden: the hands reach the sheet, it leaves the first tray and ends in the
// last one, the route lines and step discs (pips) are visible, the ● pin and the sign show; nothing written in the room.
test(`${ID}: labels hidden — the sheet travels from the first tray to the last along visible numbered steps; no text`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
    const x = def.create(el, {width: 1920, height: 1080, params: {textVisibility: 'none'}});
    await x.ready;
    const svg = x.element;
    const op = e => { if (!e) return 0; let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
    x.seek(0); const h0 = x.getState({bounds: false}).semantic;
    x.seek(0.19 * x.durationMs); const h1 = x.getState({bounds: false}).semantic;
    x.seek(x.durationMs); const h2 = x.getState({bounds: false}).semantic;
    const lines = [...svg.querySelectorAll('[data-node^="rm-rt"]')].map(op);
    const pips = [...svg.querySelectorAll('[data-node^="rm-step"][data-node$="-disc"]')].map(op);
    return {raised: Math.hypot(h1.hand.x - h0.hand.x, h1.hand.y - h0.hand.y), moved: Math.hypot(h2.doc.x - h0.doc.x, h2.doc.y - h0.doc.y), first: h0.docAt === h0.first, last: h2.docAt === h2.last, lines, pips, pin: op(svg.querySelector('[data-node="rm-doc-pin-a"]')), sign: op(svg.querySelector('[data-node="rm-sign-a"]')), text: [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length};
  }, ID);
  expect(out.raised).toBeGreaterThan(10);
  expect(out.moved).toBeGreaterThan(100);
  expect(out.first && out.last).toBe(true);
  expect(Math.min(...out.lines)).toBeGreaterThan(0.95);
  expect(Math.min(...out.pips)).toBeGreaterThan(0.95);
  expect(out.pin).toBeGreaterThan(0.95);
  expect(out.sign).toBeGreaterThan(0.95);
  expect(out.text).toBe(0);
});

// The participant laid back steps aside: at the hold, its body is clear of every station, tray and the sheet (>= 2 px at
// 1080p), in every preset × ratio × labels.
test(`${ID}: at the hold the participant stands clear of every station and of the sheet`, async ({page}) => {
  test.setTimeout(400000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    x.seek(x.durationMs);
    const S = svg.getBoundingClientRect(), k = 1080 / Math.min(S.width, S.height);
    const hd = node(svg, 'rm-p0-head');
    if (!hd) return out;
    const c = headCircle(hd);
    let least = 1e9;
    for (const e of [...nodes(svg, /^rm-st\\d+-plate$/), node(svg, 'rm-doc-k')]) {
      if (!e || eff(svg, e) < 0.3) continue;
      const d = localDist(e, c) - c.r;
      least = Math.min(least, d * k);
    }
    stat('least head clearance px ' + ratio, Math.round(least * 10) / 10);
    if (least < 2) out.push(pr.name + ' ' + ratio + ': the head is ' + least.toFixed(1) + ' px from a station or the sheet');
    return out;`, {}, {withHidden: true});
  report(ID, 'hold clearance', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Item 20: long-labels-stress supplies its state caption, longer than the baseline's rendered tag, in every ratio.
test(`${ID}: long-labels-stress supplies a hold caption longer than the baseline's (rendered)`, async ({page}) => {
  const stress = presetsFor(ID).find(q => q.name === 'long-labels-stress').params;
  expect(typeof stress.stateCaption).toBe('string');
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async ([id, stress]) => {
    const def = await window.__lib.load(id);
    const res = [];
    for (const [w, h] of [[1920, 1080], [1080, 1080], [1080, 1920]]) {
      const tag = {};
      for (const [k, params] of [['base', {}], ['stress', stress]]) {
        const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params}); await x.ready; x.seek(x.durationMs);
        const n = x.element.querySelector('[data-node="state-tag"]');
        tag[k] = n ? [...n.querySelectorAll('tspan')].map(q => q.textContent.trim()).filter(Boolean).join(' ').replace(/\s+/g, ' ') : '';
        x.destroy(); el.remove();
      }
      res.push(tag);
    }
    return res;
  }, [ID, stress]);
  for (const t of out) {
    expect(t.stress).toBe(stress.stateCaption);
    expect(t.stress.length).toBeGreaterThan(t.base.length);
  }
});
stepDiscClearTest(ID);
