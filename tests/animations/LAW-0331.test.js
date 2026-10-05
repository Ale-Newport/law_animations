// LAW-0331 — Solicitud de autorización · contrast. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): both scenes exist (two complete rooms), exactly the supplied fact changes (the supplied state:
// "authorization requested" in A, "decision supplied" in B) and it changes objects, not only text or colour (B gets a
// second object — the decision's placeholder sheet, content never shown — laid in the prior-examination tray's other
// slot, so the petition ends beside it; A's tray keeps that slot empty), and no legal consequence is invented.
// Timing (u): base 0–0.17 (identical) · state introduced 0.22–0.32 (signs ● / ◆; A's ● pin on the petition; B's decision
// sheet laid 0.24–0.30 with its ◆ pin) · action 0.40–0.765 in both rooms (hands 0.40–0.43, lift, carry 0.455–0.70, laid,
// let go, step back) · guide 0.78–0.85.
// Legal (VERY HIGH risk): abstract fictional stations of the same size on one row in both rooms; the path is only the
// supplied sequence; the prior-examination tray is a neutral tray; ● and ◆ have equal weight (same disc, same ink, same
// timing); no leave rule, criterion, threshold, time limit, rank or outcome; neither state preferred. People floors
// (coordinator; review = hearings, FIGURE): >= 60 px off 1:1, >= 55 px at 1:1, long-labels-stress >= 45 px at every
// ratio. Rooms: side by side on wide frames (each >= 0.40 of the frame width at 16:9; at 1:1 two rooms side by side above
// a band, each ~0.48 of the width), stacked at 9:16 (each >= 0.80 of the width). Omitted brief field (see the presets
// note): grounds.
import {test, expect} from '@playwright/test';
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, textLinesVisibleTest, subjectFrameTest, linesOffTextTest} from './exposicion-inicial-checks.js';
import {bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, esSuppliedTagTest, routeConsistencyTest, equalBodiesTest, routeAnchoredTest, routeOffTextTest, glyphStateTest, noTwinTextTest, gluedNumbersTest, noOneWordLineTest, stepDiscClearTest, ES_WORDS, FLOOR_FOR} from './solicitud-autorizacion-checks.js';

const ID = 'LAW-0331';
const ROOMS = ['ra', 'rb'];

contractSuite(ID, {
  continuity: ['sheetA', 'sheetB', 'personA', 'personB', 'handA', 'handB'],
  semantic: [
    {at: 0, fn: "s.beat === 'base' && s.docA === s.first && s.docB === s.first && s.decB === 0 && s.signA === 0 && s.reachA === 0 && s.lookA === s.lookB", label: 'base: both rooms identical; the petition in the first tray; no state shown'},
    {at: 0.15, fn: 's.lookA === s.lookB && s.decB === 0 && s.pin === 0', label: 'nothing differs before the change beat'},
    {at: 0.33, fn: 's.signA === 1 && s.signB === 1 && s.decB === 1 && s.pin === 1 && s.docA === s.first && s.docB === s.first && s.reachA === 0 && s.reachB === 0', label: 'introduce: each room shows its supplied state (● / ◆) at the same moment; B\'s decision sheet lies in the prior-examination tray; nothing has moved yet'},
    {at: 0.43, fn: 's.reachA > 0.99 && s.reachB > 0.99 && s.docA === s.first && s.docB === s.first', label: 'both: the hands reach the petition before it moves'},
    {at: 0.52, fn: 's.docA === -1 && s.docB === -1', label: 'action: both carry the petition along the path'},
    {at: 1, fn: 's.docA === s.last && s.docB === s.last && s.exam === s.last && s.decB === 1 && s.guide === 1 && s.allReached && s.problems.length === 0', label: 'hold: both petitions in the prior-examination tray; B\'s beside the decision sheet; the guide; the composition fits'},
    {at: 0.6, params: {textVisibility: 'none'}, fn: 's.docA === -1 && s.docB === -1 && s.decB === 1', label: 'labels hidden: the same difference'},
    {at: 0.1, fn: 's.lookA === s.lookB && s.docA === s.first', label: 'seeking back restores the identical base'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: 'return [p.decisions.title, p.decisions.supplied, p.courier.label, ...p.routes.bodies.map(b => b.label), p.outcomes.a, p.outcomes.b, p.scenarioA.label, p.scenarioB.label, p.labels.route, p.labels.sequence, p.labels.exam, p.labels.key, p.changedFact, ...p.sharedFacts, p.objectLabels.tray, p.objectLabels.calendar, p.comparisonLabels.guide, p.comparisonLabels.neutral];',
  content: 'return [p.decisions.title, p.decisions.supplied, p.courier.label, ...p.routes.bodies.map(b => b.label), p.outcomes.a, p.outcomes.b, p.changedFact];',
  captions: 'return [p.labels.sequence, p.labels.exam, p.objectLabels.tray, p.objectLabels.calendar];',
});

ratioChecks(ID, 'equal pace in both rooms, cause before effect, composition fits', [
  {at: times(0, 1, 0.005), fn: 's.stepKA.every((q, j) => q === s.stepKB[j]) && s.docA === s.docB && s.reachA === s.reachB && s.signA === s.signB', label: 'A and B run over the same windows at every u'},
  {at: times(0, 0.8, 0.005), fn: '(s.docA !== -1 || s.reachA > 0.99) && (s.docB !== -1 || s.reachB > 0.99)', label: 'off a tray the petition is always in the hands'},
  {at: times(0, 0.2, 0.005), fn: 's.decB === 0 && s.pin === 0', label: 'nothing of the difference shows before the change beat'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0', label: 'the composition fits'},
]);

const PROPS = ['[data-node="ra-clock"]', '[data-node="ra-sign"]', '[data-node="rb-clock"]', '[data-node="rb-sign"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: ['[data-node="ra-doc"]', '[data-node="rb-doc"]', '[data-node="rb-dec"]', '[data-node="ra-p0"]', '[data-node="rb-p0"]']});
// (the guide is checked along its stroke by linesOffTextTest: its bounding box spans both rooms)
noOverlapTest(ID, {markers: ['[data-node^="r"][data-node$="-p0-head"]', '[data-node="ra-doc"]', '[data-node="rb-doc"]', '[data-node="rb-dec"]', '[data-node="ra-sign"]', '[data-node="rb-sign"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {re: '^r[ab]-p0$', floorFor: FLOOR_FOR});
// (the decision sheet is drawn under the participant, so it never covers a head)
headsClearTest(ID, {heads: '^r[ab]-p0-head$', covers: ['[data-node="guide"]', '[data-node="ra-sign"]', '[data-node="rb-sign"]', '[data-node="ra-doc"]', '[data-node="rb-doc"]', '[data-node^="r"][data-node*="-st"][data-node$="-plate"]', '[data-node^="hdr"]']});
armsClearTest(ID, {props: PROPS});
equalWeightTest(ID, {at: [0.35, 1], marks: [['[data-node="ra-sign-a-d-g"]', '[data-node="rb-sign-b-d-g"]'], ['[data-node="ra-doc-pin-a-g"]', '[data-node="rb-dec-pin-b-g"]'], ['[data-node="hdrA-cue"]', '[data-node="hdrB-cue"]']]});
neutralityTest(ID);
bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
esSuppliedTagTest(ID);
routeConsistencyTest(ID);
equalBodiesTest(ID, {rooms: ROOMS});
routeAnchoredTest(ID, {rooms: ROOMS});
routeOffTextTest(ID, {rooms: ROOMS});
glyphStateTest(ID, {prefixes: ROOMS});
noTwinTextTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.1, 0.25, 0.35, 0.5, 0.65, 0.8, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="ra-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
textLinesVisibleTest(ID);
linesOffTextTest(ID, {lines: ['[data-node="guide"]']});
gluedNumbersTest(ID);
noOneWordLineTest(ID);

// The one changed fact adds a real object, large inside the scene (rendered, every preset × ratio × labels): before
// u = 0.17 both rooms render identically (petition, participant, the empty decision slot, sign); at the hold both
// petitions lie in the prior-examination tray, B's decision sheet (no text on it) lies in the same tray's other slot and
// A's slot stays empty; the signs show ● in A and ◆ in B, each sign >= 3 % of the frame width; the decision sheet is as
// large as the petition.
test(`${ID}: the changed fact adds a real object — the decision sheet in B's prior-examination tray; signs follow the state`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    const F = svg.getBoundingClientRect();
    const rel = (P, n) => { const W0 = box(node(svg, P + '-walls')); const b = box(node(svg, P + '-' + n)); return [Math.round((b.l - W0.l) * 10) / 10, Math.round((b.t - W0.t) * 10) / 10]; };
    for (const u of [0, 0.08, 0.16]) {
      x.seek(u * x.durationMs);
      for (const n of ['doc', 'p0']) if (JSON.stringify(rel('ra', n)) !== JSON.stringify(rel('rb', n))) out.push(tag + ' u=' + u + ': ' + n + ' differs before the change');
      for (const P of ['ra', 'rb']) if (eff(svg, node(svg, P + '-dec')) > 0.01 || eff(svg, node(svg, P + '-sign')) < 0.5) out.push(tag + ' u=' + u + ': ' + P + ' shows a state before the change');
    }
    x.seek(x.durationMs);
    const s = x.getState({bounds: false}).semantic;
    if (s.docA !== s.last || s.docB !== s.last) out.push(tag + ': petitions at ' + s.docA + ' / ' + s.docB);
    if (eff(svg, node(svg, 'ra-dec')) > 0.05) out.push(tag + ': A shows a decision sheet');
    const dec = node(svg, 'rb-dec');
    if (eff(svg, dec) < 0.95) out.push(tag + ': B shows no decision sheet');
    else {
      const d = box(node(svg, 'rb-dec-k')), t = box(node(svg, 'rb-st' + s.exam + '-tray')), p = box(node(svg, 'rb-doc-k'));
      if (d.l < t.l - 2 || d.r > t.r + 2 || d.t < t.t - 2 || d.b > t.b + 2) out.push(tag + ': the decision sheet is not inside the prior-examination tray');
      if (hit(d, p, -1)) out.push(tag + ': the decision sheet and the petition overlap');
      if (Math.abs(d.w - p.w) > 1.5) out.push(tag + ': the decision sheet and the petition differ in size');
      if (dec.querySelector('text')) out.push(tag + ': text on the decision sheet');
      stat('decision sheet share ' + ratio, Math.round(d.w / F.width * 1000) / 1000);
    }
    for (const [P, sd] of [['ra', 'a'], ['rb', 'b']]) {
      const sg = node(svg, P + '-sign-' + sd);
      if (!sg || eff(svg, sg) < 0.95) { out.push(tag + ': ' + P + ' sign ' + sd + ' not shown'); continue; }
      const w0 = box(node(svg, P + '-sign-body')).w / F.width;
      stat('sign width share ' + ratio, Math.round(w0 * 1000) / 1000);
      if (w0 < 0.03) out.push(tag + ': ' + P + ' sign ' + w0.toFixed(3) + ' of the frame width');
    }
    if (nodes(svg, /^r[ab]-rt\\d+$/).some(e => eff(svg, e) < 0.95) || nodes(svg, /^r[ab]-rd\\d+$/).some(e => eff(svg, e) > 0.05)) out.push(tag + ': a path line is not drawn solid');
    return out;`, {}, {withHidden: true});
  report(ID, 'changed fact', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Item 18 and the contrast layout: side by side at 16:9 (each room >= 0.40 of the frame width) and at 1:1 (each >= 0.40;
// with labels hidden 1:1 may stack the rooms full width instead), stacked at 9:16 (each >= 0.80 of the width, B below
// A); the rooms never overlap.
test(`${ID}: two complete rooms — side by side on wide and square frames (>= 0.40 W each), stacked on tall ones (>= 0.80 W)`, async ({page}) => {
  test.setTimeout(400000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    svg.style.width = w + 'px'; svg.style.height = h + 'px';
    x.seek(x.durationMs);
    const F = svg.getBoundingClientRect();
    const A = box(node(svg, 'ra-walls')), B = box(node(svg, 'rb-walls'));
    const wa = A.w / F.width, wb = B.w / F.width;
    stat('room width share ' + ratio, Math.round(Math.min(wa, wb) * 1000) / 1000);
    if (hit(A, B, 0)) out.push(pr.name + ' ' + ratio + ': the rooms overlap');
    const stacked = B.t >= A.b - 1;
    if (ratio === '9:16' || (ratio === '1:1' && stacked)) { if (!(B.t >= A.b - 1) || Math.min(wa, wb) < 0.8) out.push(pr.name + ' ' + ratio + ': not stacked full width (' + wa.toFixed(2) + ')'); }
    else if (!(B.l >= A.r - 1) || Math.min(wa, wb) < 0.4) out.push(pr.name + ' ' + ratio + ': not side by side >= 0.40 W (' + wa.toFixed(3) + ')');
    return out;`, {}, {withHidden: true});
  report(ID, 'rooms', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// The guide links the changed detail: drawn at the hold, it starts on sign A's top edge and ends on sign B's top edge.
test(`${ID}: the guide runs from sign A to sign B (rendered ends on both signs)`, async ({page}) => {
  test.setTimeout(300000);
  const {bad} = await forAll(page, ID, `
    const out = [];
    x.seek(x.durationMs);
    const gd = node(svg, 'guide');
    if (eff(svg, gd) < 0.95) return [pr.name + ' ' + ratio + ': no guide'];
    const m = gd.getScreenCTM(); const L = gd.getTotalLength();
    const p0 = new DOMPoint(gd.getPointAtLength(0).x, gd.getPointAtLength(0).y).matrixTransform(m), p1 = new DOMPoint(gd.getPointAtLength(L).x, gd.getPointAtLength(L).y).matrixTransform(m);
    const A = box(node(svg, 'ra-sign-body')), B = box(node(svg, 'rb-sign-body'));
    if (p0.x < A.l || p0.x > A.r || Math.abs(p0.y - A.t) > 3) out.push(pr.name + ' ' + ratio + ': the guide does not start on sign A');
    if (p1.x < B.l || p1.x > B.r || Math.abs(p1.y - B.t) > 3) out.push(pr.name + ' ' + ratio + ': the guide does not end on sign B');
    return out;`, {}, {withHidden: false});
  expect(bad, bad.join('\n')).toEqual([]);
});

// Nothing teleports (rendered, 60 fps): petitions and participants move < 40 px per frame; both petitions visit the trays
// of the supplied path in order.
test(`${ID}: continuous motion; both petitions visit the path's trays in the supplied order`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    let prev = null, worst = 0;
    const vA = [], vB = [];
    for (let ms = 0; ms <= x.durationMs + 1e-6; ms += 1000 / 60) {
      x.seek(ms);
      const s = x.getState({bounds: false}).semantic;
      const now = [s.sheetA, s.sheetB, s.personA, s.personB];
      if (prev) now.forEach((q, i) => { worst = Math.max(worst, Math.hypot(q.x - prev[i].x, q.y - prev[i].y) * s.pxu); });
      prev = now;
      if (s.docA >= 0 && vA[vA.length - 1] !== s.docA) vA.push(s.docA);
      if (s.docB >= 0 && vB[vB.length - 1] !== s.docB) vB.push(s.docB);
    }
    const s1 = x.getState({bounds: false}).semantic;
    stat('max move px/frame ' + ratio, Math.round(worst), 'max');
    if (worst > 40) out.push(tag + ': something jumps ' + Math.round(worst) + ' px in one frame');
    if (vA.join('>') !== s1.steps.join('>')) out.push(tag + ': A visits ' + vA.join('>'));
    if (vB.join('>') !== s1.steps.join('>')) out.push(tag + ': B visits ' + vB.join('>'));
    return out;`, {}, {withHidden: true});
  report(ID, 'continuity', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Neutral colours (coordinator, review-03): the two lane discs are neither green nor red (no approval / refusal reading),
// and they have the same size.
test(`${ID}: the lane discs are neither green nor red and have the same size`, async ({page}) => {
  test.setTimeout(300000);
  const {bad} = await forAll(page, ID, `
    const out = [];
    x.seek(x.durationMs);
    const hue = c => { const m = c.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i); if (!m) return null; const [r0, g0, b0] = [1, 2, 3].map(i => parseInt(m[i], 16) / 255); const mx = Math.max(r0, g0, b0), mn = Math.min(r0, g0, b0); if (mx - mn < 0.08) return {h: 0, s: 0}; let h0 = mx === r0 ? ((g0 - b0) / (mx - mn)) % 6 : mx === g0 ? (b0 - r0) / (mx - mn) + 2 : (r0 - g0) / (mx - mn) + 4; h0 *= 60; if (h0 < 0) h0 += 360; return {h: h0, s: (mx - mn) / mx}; };
    const discs = ['hdrA', 'hdrB'].map(n => node(svg, n)).filter(Boolean).map(e => e.querySelector('circle'));
    for (const d of discs) {
      const q = hue(d.getAttribute('fill'));
      if (!q) { out.push(pr.name + ' ' + ratio + ': lane fill ' + d.getAttribute('fill')); continue; }
      if (q.s > 0.25 && ((q.h >= 75 && q.h <= 165) || q.h <= 20 || q.h >= 340)) out.push(pr.name + ' ' + ratio + ': lane disc ' + d.getAttribute('fill') + ' reads green or red');
    }
    if (discs.length === 2 && Math.abs(box(discs[0]).w - box(discs[1]).w) > 0.5) out.push(pr.name + ' ' + ratio + ': lane discs differ in size');
    return out;`, {}, {withHidden: false});
  expect(bad, bad.join('\n')).toEqual([]);
});
stepDiscClearTest(ID, {rooms: ROOMS, lineGap: 16, discGap: 16});

// Review-03 (the changed fact was a speck): each room carries an enlarged inset of its prior-examination tray's decision
// slot. The decision sheet in B's inset — the one physical difference — is >= 85 px tall at 1080p in the baseline presets
// (default, baseline-illustrative, baseline-es) and >= 70 px in every other preset (long-labels-stress, contrast), in
// every ratio, labels shown and hidden (rendered DOM, at the hold). Both insets are alike: the same size and the same
// place in their rooms (within 0.5 px); A's slot stays empty; B's sheet is not shown before the change beat (u < 0.17) and
// follows the room's own decision sheet afterwards.
test(`${ID}: the changed fact is large — B's inset decision sheet >= 85 px (baselines) / >= 70 px (others); both insets alike`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    svg.style.width = w + 'px'; svg.style.height = h + 'px';
    const k = 1080 / Math.min(w, h) * (w / svg.getBoundingClientRect().width);
    const n = q => node(svg, q);
    if (!n('ra-ins') || !n('rb-ins')) { out.push(tag + ': an inset is missing'); return out; }
    const base = /^(default|baseline-illustrative|baseline-es)/.test(pr.name);
    for (let u = 0; u <= 1.0001; u += 0.01) {
      x.seek(u * x.durationMs);
      const dA = eff(svg, n('ra-ins-dec')), dB = eff(svg, n('rb-ins-dec')), dR = eff(svg, n('rb-dec'));
      if (dA > 0.001) out.push(tag + ' u=' + u.toFixed(2) + ': A\\'s inset shows a decision sheet');
      if (u < 0.17 && dB > 0.001) out.push(tag + ' u=' + u.toFixed(2) + ': B\\'s inset shows the sheet before the change beat');
      if (Math.abs(dB - dR) > 0.002) out.push(tag + ' u=' + u.toFixed(2) + ': B\\'s inset (' + dB.toFixed(3) + ') does not follow the room (' + dR.toFixed(3) + ')');
    }
    x.seek(x.durationMs);
    const fa = n('ra-ins-frame').getBoundingClientRect(), fb = n('rb-ins-frame').getBoundingClientRect();
    const wa = n('ra-walls').getBoundingClientRect(), wb = n('rb-walls').getBoundingClientRect();
    if (Math.abs(fa.width - fb.width) > 0.5 || Math.abs(fa.height - fb.height) > 0.5 || Math.abs((fa.left - wa.left) - (fb.left - wb.left)) > 0.5 || Math.abs((fa.top - wa.top) - (fb.top - wb.top)) > 0.5) out.push(tag + ': the two insets differ in size or place');
    // (the sheet's own body — its second rect; the first is its drop shadow, which is not counted)
    const body = e => e.querySelectorAll('rect')[1].getBoundingClientRect();
    const sh = body(n('rb-ins-dec-k')).height * k;
    const sw = body(n('rb-ins-dec-k')).width * k;
    const room = n('rb-dec-k') ? body(n('rb-dec-k')).height * k : 0;
    stat('inset sheet h px ' + (base ? 'baseline ' : 'other ') + ratio, Math.round(sh * 10) / 10);
    stat('inset sheet w px ' + (base ? 'baseline ' : 'other ') + ratio, Math.round(sw * 10) / 10);
    stat('room sheet h px ' + ratio, Math.round(room * 10) / 10);
    const min = base ? 85 : 70;
    if (sh < min) out.push(tag + ': B\\'s inset decision sheet ' + sh.toFixed(1) + ' px < ' + min);
    if (eff(svg, n('rb-ins-dec')) < 0.95) out.push(tag + ': B\\'s inset sheet not shown at the hold');
    return out;`, {}, {withHidden: true});
  report(ID, 'inset size', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// The inset lies in free floor: at every u (step 0.01) its frame never meets the participant, the petition, a station,
// a step disc, the sign or the calendar of its room (rendered boxes, every preset × ratio × labels).
test(`${ID}: the insets never meet the participant, the petition, a station, a step disc, the sign or the calendar`, async ({page}) => {
  test.setTimeout(600000);
  const {bad} = await forAll(page, ID, `
    const out = [];
    for (const pf of ['ra', 'rb']) {
      const fr = node(svg, pf + '-ins-frame');
      if (!fr) { out.push(pr.name + ' ' + ratio + ': no inset in ' + pf); continue; }
      const others = () => [node(svg, pf + '-p0'), node(svg, pf + '-doc'), node(svg, pf + '-sign'), node(svg, pf + '-clock'), ...nodes(svg, new RegExp('^' + pf + '-st\\\\d+-plate$')), ...nodes(svg, new RegExp('^' + pf + '-step\\\\d+-disc$'))].filter(Boolean);
      for (let u = 0; u <= 1.0001; u += 0.01) {
        x.seek(u * x.durationMs);
        const b = box(fr);
        for (const e of others()) if (eff(svg, e) > 0.05 && hit(b, box(e), 0)) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': ' + pf + ' inset meets ' + e.getAttribute('data-node'));
      }
    }
    return out;`, {}, {withHidden: true});
  expect(bad, bad.join('\n')).toEqual([]);
});
