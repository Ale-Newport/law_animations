// LAW-0097 — Condiciones acumulativas · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of motion, object anchoring (each contributor's
// solved hand holds its piece at the gear hub while carrying; the tester's hand
// stays on the crank knob while turning) and a transformation that stays
// recognizable with labels hidden (pieces seat, the gear line turns, the dial
// moves only when every piece is seated).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';

// Placement windows for the default content (3 pieces): start 0.15 + k·0.125,
// length 0.2; the hand holds the piece from 20% to 80% of its window.
const carry = k => {
  const s = 0.15 + k * 0.125;
  return [s + 0.2 * 0.2 + 0.002, s + 0.8 * 0.2 - 0.002];
};

contractSuite('LAW-0097', {
  continuity: ['pc0', 'pc1', 'pc2', 'hand0', 'hand1', 'hand2', 'testerHand', 'knob'],
  attach: [
    {from: carry(0)[0], to: carry(0)[1], a: 'hand0', b: 'grip0', tol: 1.5},
    {from: carry(1)[0], to: carry(1)[1], a: 'hand1', b: 'grip1', tol: 1.5},
    {from: carry(2)[0], to: carry(2)[1], a: 'hand2', b: 'grip2', tol: 1.5},
    // the tester's hand stays on the crank knob while turning it
    {from: 0.621, to: 0.729, a: 'testerHand', b: 'knob', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.pieces.every(p => p === 'staged') && s.theta === 0 && s.dial === 0 && s.seated === 0", label: 'rest: every piece waits at the bench edge, nothing turns'},
    {at: 0.14, fn: "s.pieces.every(p => p === 'staged') && s.theta === 0", label: 'nothing moves before the action beat'},
    {at: 0.3, fn: "s.pieces[0] === 'seated' && s.pieces[1] === 'staged' && s.pieces[2] === 'staged'", label: 'pieces are seated one after another, in their own lanes'},
    {at: 0.6, fn: 's.seated === 3 && s.theta === 0 && s.dial === 0', label: 'all pieces seated before the crank turns (cause precedes the visible effect)'},
    {at: 0.66, fn: 's.onKnob && Math.abs(s.theta) > 0 && Math.abs(s.theta) < 180 && s.dial > 0 && s.dial < 1', label: 'the tester turns the crank; the dial follows the output gear'},
    {at: 1, fn: "s.seated === 3 && Math.abs(s.theta) === 180 && s.dial === 1 && s.dialLamp && s.turned.every(Boolean) && s.complete && s.allReached", label: 'final hold: every piece seated, the whole gear line turned, dial at its filled end'},
    {at: 1, params: {rules: {name: 'Rule G-4 (fictional)', conditions: ['A', 'B', 'C', 'D']}, facts: [{label: 'a', status: 'supplied'}, {label: 'b', status: 'supplied'}, {label: 'c', status: 'pending'}, {label: 'd', status: 'supplied'}]},
      fn: "s.breakAt === 2 && s.pieces[2] === 'absent' && s.seated === 3 && s.turned[1] && s.turned[2] && !s.turned[4] && !s.turned[5] && s.dial === 0 && !s.dialLamp", label: 'pending piece: pocket stays empty, motion stops at the gap, the dial does not move'},
    {at: 1, params: {facts: [{label: 'a', status: 'supplied'}, {label: 'b', status: 'disputed'}, {label: 'c', status: 'supplied'}]},
      fn: "s.pieces[1] === 'unseated' && s.breakAt === 1 && s.turned[1] && !s.turned[2] && s.dial === 0", label: 'disputed piece: brought but not seated; nothing downstream turns (not resolved here)'},
    {at: 1, params: {facts: [{label: 'a', status: 'supplied'}, {label: 'b', status: 'supplied'}]},
      fn: "s.statuses[2] === 'pending' && s.pieces[2] === 'absent' && s.dial === 0", label: 'a condition without any fact piece is shown as pending'},
    {at: 1, params: {finalState: 'assembled'}, fn: "s.seated === 3 && s.theta === 0 && s.dial === 0 && s.testerHand === undefined", label: 'assembled final state: pieces seated, no test turn'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.seated < 3 && s.theta === 0", label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {rules: {name: 'Rule five (fictional)', conditions: ['A', 'B', 'C', 'D', 'E']}, facts: [{label: 'a', status: 'supplied'}, {label: 'b', status: 'supplied'}, {label: 'c', status: 'supplied'}, {label: 'd', status: 'supplied'}, {label: 'e', status: 'supplied'}]},
      fn: "s.n === 5 && s.seated === 5 && s.dial === 1 && s.allReached", label: 'five conditions: all five pieces seated and the dial reached'},
    // square and tall caption-safe boxes (made here with wide side margins) use the supply tray
    {at: 0, fn: "s.stage === 'lanes' && s.trayClear && !s.dialCapOnPath", label: 'wide box: every waiting piece is whole and clear of the others; the dial caption lies on no carried piece\'s path'},
    {at: 0, params: {safeArea: {left: 0.2, right: 0.2, top: 0.06, bottom: 0.06}}, fn: "s.stage === 'pile' && s.trayClear && !s.dialCapOnPath && s.factSize >= 29 && s.pieces.every(p => p === 'staged')", label: 'square box, rest: the tray shows every piece and gear side by side / staggered (none hidden); the dial caption lies on no carried piece\'s path; fact text is not shrunk'},
    {at: 0, params: {safeArea: {left: 0.3, right: 0.3, top: 0.04, bottom: 0.04}}, fn: "s.stage === 'pile' && s.trayClear && !s.dialCapOnPath", label: 'tall box, rest: the tray shows every piece and gear (none hidden)'},
    {at: 0, params: {safeArea: {left: 0.3, right: 0.3, top: 0.04, bottom: 0.04}, rules: {name: 'Rule five (fictional)', conditions: ['A', 'B', 'C', 'D', 'E']}, facts: [{label: 'a', status: 'supplied'}, {label: 'b', status: 'supplied'}, {label: 'c', status: 'disputed'}, {label: 'd', status: 'supplied'}, {label: 'e', status: 'supplied'}]}, fn: "s.stage === 'pile' && s.gearsClear && s.n === 5", label: 'tall box, five pieces: every gear (pips) stays in view in the tray'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.seated === 3 && s.dial === 1 && s.turned.every(Boolean)", label: 'labels hidden: the same physical transformation happens'},
  ],
});

// Content text floors (px at 1080p), no ellipsis, whole pieces at rest, role captions near
// their actors and the issue note, at the REAL output sizes: every preset × 16:9 / 1:1 / 9:16.
test('LAW-0097: content ≥ 16 px, no ellipsis, whole pieces at rest, captions and note drawn, in every preset and ratio', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = presetsFor('LAW-0097');
  const rows = await page.evaluate(async ([ps]) => {
    const def = await window.__lib.load('LAW-0097');
    const out = [];
    for (const pr of ps) {
      for (const [w, h] of [[1920, 1080], [1080, 1080], [1080, 1920]]) {
        const at = u => def.evaluate({width: w, height: h, params: pr.params, timeMs: u * def.defaultParams.durationMs}).semantic;
        out.push({preset: pr.name, params: pr.params, w, h, rest: at(0), end: at(1), turn: at(0.66)});
        const hid = def.evaluate({width: w, height: h, params: {...pr.params, textVisibility: 'none'}, timeMs: def.defaultParams.durationMs}).semantic;
        out[out.length - 1].hidden = hid;
      }
    }
    return out;
  }, [presets]);
  for (const x of rows) {
    const where = `${x.preset} ${x.w}x${x.h}`;
    const s = x.rest;
    expect.soft(s.text.truncated, `${where}: no fact / condition cut with an ellipsis`).toBe(0);
    expect.soft(s.text.content, `${where}: facts and conditions ≥ 16 px at 1080p`).toBeGreaterThanOrEqual(16);
    expect.soft(s.trayClear, `${where}: every waiting piece (card, tab, gear) whole and clear of the others at rest`).toBe(true);
    expect.soft(s.pieces.every(p => p === 'staged' || p === 'absent'), `${where}: rest beat`).toBe(true);
    expect.soft(x.end.allReached, `${where}: every hand within reach`).toBe(true);
    expect.soft(x.end.roles, `${where}: both role captions drawn`).toBe(x.params.finalState === 'assembled' ? 1 : 2);
    expect.soft(x.end.noteShown, `${where}: issue / assumption note drawn`).toBe(true);
    expect.soft(!s.dialCapOnPath, `${where}: the dial caption lies on no carried piece's path`).toBe(true);
    // minimum mechanism size (AUTHORING items 3 / 11): gears ≥ 45 px across at 1080p; the board
    // covers ≥ 20 % of the caption-safe box with cards, ≥ 14 % with the legend layout (the legend
    // then carries every word at ≥ 16 px)
    for (const [m, tag] of [[x.end, ''], [x.hidden, ' (labels hidden)']]) {
      expect.soft(m.mechanism.gearPx, `${where}${tag}: gear diameter ≥ 45 px`).toBeGreaterThanOrEqual(45);
      expect.soft(m.mechanism.boardShare, `${where}${tag}: board share of the safe box`).toBeGreaterThanOrEqual(m.legendMode ? 0.14 : 0.2);
    }
    if (x.preset === 'baseline-illustrative' && x.w === 1080 && x.h === 1080) expect.soft(s.text.content, `${where}: square baseline keeps ≈ 20 px text on the cards`).toBeGreaterThanOrEqual(19);
    if (x.preset === 'long-labels-stress' && x.w <= x.h) expect.soft(s.legendMode, `${where}: long texts on square / tall boxes use the shared legend (pictogram pieces)`).toBe(true);
  }
});
