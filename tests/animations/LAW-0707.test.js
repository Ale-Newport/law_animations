// LAW-0707 — Agravación de daño · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist (two complete panel rigs of equal size), exactly the indicated fact
// changes (only where each rail's stop is clamped: A's ● stop at the initial level, B's ◆ stop at the supplied later
// level, so only B's mark spreads) and no legal consequence is invented to complete the contrast (a neutral note and
// the key; no winner, no conclusion).
// Windows (LAW-0707.js W): heads 0–0.04 (one frame each; line without level out 0.200–0.212, line with level in 0.214–0.226) · shared entries 0–0.05 · stops 0.20–0.34 · changed-fact chip 0.22–0.30 ·
// both flags slide to the initial level 0.40–0.52, edge lines 0.51–0.55 · only B's mark spreads 0.58–0.74 · guide line
// 0.77–0.81 · bracket and guide chip 0.79–0.84 · neutral note 0.82–0.87 · key 0.84–0.89.
// coordinator decision (standing stress-cap rule, docs/AUTHORING.md item 20; subject >= 0.20 of the frame height,
// causation-05 LAW-0700 decision in production/SESSION_HANDOFF.md): the long-labels-stress COUNTS and some LENGTHS are
// capped; true driver (the 1:1 box), the fallbacks tried, the pre-cap copy and the rendered before/after numbers are in
// LAW-0707.presets.json.
// Legal (causation-07 brief): objects only, no person; neither state is a harm caused by someone; no causation test or
// doctrine, fault, liability, quantum, outcome or jurisdiction; ●/◆ at equal weight; placeholder levels.
// Brief customizable fields: none omitted (events, causalLinks, alternatives, losses + the contrast fields).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textSizeOverTime, CARDS_CLEAR, IN_FRAME, renderedTextFloor, coldCreate, restHoldFill, thinContent, subjectHeight, equalWeight, sweep, inFrameSweep, chipsClearOfProps, bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, lineBreakTest, noEnglishTest, noTokenTest} from './agravacion-dano-checks.js';

const ID = 'LAW-0707';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['flagA', 'flagB'],
  semantic: [
    {at: 0.1, fn: "s.beat === 'base' && s.stops === 0 && s.slide === 0 && s.levelA === s.initial && s.levelB === s.initial", label: 'base: two identical rigs at the initial level; no stop yet'},
    {at: 0.36, fn: 's.stops === 1 && s.slide === 0 && s.levelB === s.initial', label: 'change: the stops are in place before anything moves'},
    {at: 0.46, fn: 's.slide > 0 && s.slide < 1 && s.lookA.flag === s.lookB.flag', label: 'the same action runs in parallel on both rigs'},
    {at: 0.56, fn: 's.slide === 1 && s.levelA === s.initial && s.levelB === s.initial', label: 'both flags reach the initial level before B changes'},
    {at: 0.76, fn: 's.levelA === s.initial && s.levelB === s.later && !s.guideShown', label: 'only B’s mark spreads, to the supplied later level'},
    {at: 1, fn: 's.guideShown && s.keyShown && s.levelA === s.initial && s.levelB === s.later', label: 'hold: guide line, bracket, neutral note and key'},
    {at: 1, params: P('contrast-or-alternative'), fn: 's.levelB === s.later && s.guideShown', label: 'alternative: the tabletop and its supplied levels'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.levelB === s.later && s.guideShown', label: 'labels hidden: the same contrast'},
  ],
});

identicalBeforeChange(ID, 0.2);

ratioChecks(ID, 'layout fits the design box', [
  {at: [1], fn: 's.layout.k === 1 && !s.layout.fallback', label: 'the layout fits the design box without a fallback scale'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text, equal weight', [
  {at: [0, 0.3, 0.6, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.3, 0.6, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
  {at: [1], dom: equalWeight(['stopA', 'stopB']), label: 'the ● stop and the ◆ stop have identical weight, both solid'},
  {at: [1], dom: equalWeight(['flagA', 'flagB']), label: 'the two flags are identical'},
  {at: [1], dom: equalWeight(['rApanel', 'rBpanel']), label: 'the two panels are drawn with identical weight'},
  {at: [1], tv: ['all'], dom: equalWeight(['hA', 'hB']), label: 'the A and B heads have identical weight'},
]);

ratioChecks(ID, 'no red (rendered)', [
  {at: [0.3, 1], dom: "![...svg.querySelector('[data-layer=\"scene\"]').querySelectorAll('[fill], [stroke]')].some(e => ['#c8553d', '#f3d9cf'].includes((e.getAttribute('stroke') || '').toLowerCase()) || ['#c8553d', '#f3d9cf'].includes((e.getAttribute('fill') || '').toLowerCase()))", label: 'no element uses the red accent'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.object.name, ...p.events.map(e => e.label), ...p.events.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral]",
  content: "return [...p.events.map(e => e.label), ...p.losses.map(l => l.label), p.scenarioA.label, p.scenarioB.label, p.changedFact]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

renderedTextFloor(ID, ['default', 'baseline-illustrative', 'baseline-es'], 19.5, 0.01);
textSizeOverTime(ID, 0.01);

// Each scene's share of the FRAME width: >= 0.40 side by side, >= 0.71 stacked, >= 0.55 stacked beside a text column
// (the lane is the floor each rig stands on), labels shown and hidden, at rest and at the hold.
sweep(ID, 'each scene spans its share of the frame width (rendered)', `
  let worst = Infinity;
  for (const u of [0.1, 1]) {
    x.seek(u * x.durationMs);
    const s = x.getState({bounds: false}).semantic;
    const F = frameBox();
    const need = s.arrangement === 'row' ? 0.4 : s.arrangement === 'textcol' ? 0.55 : 0.71;
    for (const n of ['floorA', 'floorB']) {
      const w = svg.querySelector('[data-node="' + n + '"]').getBoundingClientRect().width / F.width;
      worst = Math.min(worst, w);
      if (w < need - 0.002) out.push(tag + ' u=' + u + ': ' + n + ' ' + w.toFixed(3) + ' < ' + need + ' (' + s.arrangement + ')');
    }
  }
  return 'min scene width ' + worst.toFixed(3);
`);

restHoldFill(ID, [0.1, 1]);
thinContent(ID);
// the subject: each rig (panel, flag) standing on its floor
subjectHeight(ID, [['rApanel', 'flagA', 'floorA'], ['rBpanel', 'flagB', 'floorB']], [0.1, 1]);
coldCreate(ID, 800);
inFrameSweep(ID);
chipsClearOfProps(ID, '^(band-.*|guide-chip-g|hA|hB)$', '^(r[AB]panel|flag[AB]|stop[AB])$', [0.1, 0.3, 0.5, 0.62, 0.7, 0.8, 0.9, 1]);
noTokenTest(ID, ['rBpanel'], [0.1, 1]);

// Review 2026-10-05 (content): any number (digit or number word, en/es) in a drawn shared fact equals the number of
// entries actually drawn (rendered band-ev* chips), in every preset × ratio.
sweep(ID, 'shared-fact numbers match the drawn entry count (rendered)', `
  x.seek(x.durationMs);
  const WORDS = {one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10};
  const drawn = [...svg.querySelectorAll('[data-node^="band-ev"]')].filter(e => eff(e) > 0.5).length;
  const words = [...svg.querySelectorAll('[data-node^="band-sf"]')].flatMap(e => {
    const ts = [...e.querySelectorAll('tspan')];
    return (ts.length ? ts : [...e.querySelectorAll('text')]).map(t => t.textContent).join(' ').toLowerCase().split(/[^a-z0-9áéíóúñ]+/);
  });
  for (const w0 of words) {
    const n = /^\\d+$/.test(w0) ? Number(w0) : WORDS[w0];
    if (n !== undefined && n !== drawn) out.push(tag + ': shared fact says ' + w0 + ' but ' + drawn + ' entries are drawn');
  }
  return 'entries drawn ' + drawn;
`, {tvs: ['all']});
// the same on the data (DOM-less): number words or digits in sharedFacts equal the events count in every preset
test(`${ID}: shared-fact numbers match the entry count (data)`, () => {
  const WORDS = {one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10};
  for (const pr of presetsFor(ID)) {
    const n = (pr.params.events || []).length;
    for (const f of pr.params.sharedFacts || []) for (const w0 of f.toLowerCase().split(/[^a-z0-9áéíóúñ]+/)) {
      const k = /^\d+$/.test(w0) ? Number(w0) : WORDS[w0];
      if (k !== undefined) expect(k, `${pr.name}: "${f}"`).toBe(n);
    }
  }
});

// Review 2026-10-05 (item 9, round 2): each head has ONE frame; before the change beat it shows the line without a
// level, after it the line with the level, swapped in sequence. At 60 fps in every preset × ratio: the two lines are
// never both >= 0.15 opacity, each head draws exactly one visible chip frame, the A and B heads swap alike, no level
// line before u 0.20, and the gap with neither line legible (while the head is shown) is <= 180 ms.
sweep(ID, 'head text swaps in sequence in one frame (rendered, 60 fps)', `
  const fps = 60, frames = Math.round(x.durationMs / 1000 * fps);
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  let gapRun = 0, worstGap = 0;
  for (let f = 0; f <= frames; f++) {
    x.renderFrame(f, {fps});
    const u = f / frames;
    const st = [];
    for (const hn of ['hA', 'hB']) {
      const head = q(hn), t0 = q(hn + '-t0'), t1 = q(hn + '-t1');
      if (!t0 || !t1) { out.push(tag + ': ' + hn + ' lacks its two text lines'); return; }
      const o0 = eff(t0), o1 = eff(t1), oh = eff(head);
      if (o0 >= 0.15 && o1 >= 0.15) out.push(tag + ' f' + f + ': ' + hn + ' both lines legible (' + o0.toFixed(2) + ' / ' + o1.toFixed(2) + ')');
      if (u < 0.2 && o1 > 0.001) out.push(tag + ' f' + f + ': ' + hn + ' level line before the change beat');
      const hb = head.getBoundingClientRect();
      const framesN = [...head.querySelectorAll('path, rect')].filter(e => e.getAttribute('fill') && e.getAttribute('fill') !== 'none' && eff(e) >= 0.05).filter(e => { const b = e.getBoundingClientRect(); return b.width >= hb.width * 0.9 && b.height >= hb.height * 0.9; }).length;
      if (oh >= 0.05 && framesN !== 1) out.push(tag + ' f' + f + ': ' + hn + ' draws ' + framesN + ' chip frames');
      st.push([Math.round(o0 * 1000), Math.round(o1 * 1000), oh]);
    }
    if (st[0][0] !== st[1][0] || st[0][1] !== st[1][1]) out.push(tag + ' f' + f + ': A and B heads swap differently');
    const shown = st[0][2] >= 0.95;
    if (shown && st[0][0] < 150 && st[0][1] < 150) { gapRun++; worstGap = Math.max(worstGap, gapRun); } else gapRun = 0;
    if (out.length > 6) return;
  }
  const ms = worstGap * 1000 / fps;
  if (ms > 180) out.push(tag + ': ' + Math.round(ms) + ' ms with neither head line legible');
  // no other head chips (the round-1 second chip) in the scene
  if (svg.querySelector('[data-node="hA0"], [data-node="hB0"]')) out.push(tag + ': a second head chip exists');
  return 'longest gap ' + Math.round(ms) + ' ms';
`, {tvs: ['all'], timeout: 900000});
