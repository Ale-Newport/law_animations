// LAW-0167 — Consulta entre profesionales · contrast. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: both scenes exist, exactly the indicated fact changes
// (only where the changing professional's flag goes: level with the other flag in A, alone on
// another passage in B — so the arm path and the marks differ, not only text or colour), and no
// legal consequence is invented (both states are supplied; no winner, score or conclusion).
// Timing (u; the placement clock is u): the other professional's flag is held u 0.047–0.133;
// the changing professional's flag is held u 0.464–0.605 in both scenes.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {test, expect} from '@playwright/test';

const ALT = presetsFor('LAW-0167').find(q => q.name === 'contrast-or-alternative').params;

contractSuite('LAW-0167', {
  continuity: ['handChgA', 'handChgB', 'flagChgA', 'flagChgB', 'handOtherA', 'flagOtherA'],
  attach: [
    {from: 0.05, to: 0.13, a: 'handOtherA', b: 'flagOtherA', tol: 0.5},
    {from: 0.467, to: 0.602, a: 'handChgA', b: 'flagChgA', tol: 0.5},
    {from: 0.467, to: 0.602, a: 'handChgB', b: 'flagChgB', tol: 0.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.scenes === 2 && JSON.stringify(s.a) === JSON.stringify(s.b) && s.a.holdOther !== null && s.a.atChg === 'pad' && s.a.bubble === 0 && s.a.target === 0", label: 'base: two identical scenes; the other professional lays the shared flag identically in both'},
    {at: 0.3, fn: "s.a.atOther === s.samePassage && s.b.atOther === s.samePassage && s.a.atChg === 'pad' && s.b.atChg === 'pad' && s.a.bubble > 0.9 && s.b.bubble > 0.9 && s.a.target > 0 && s.b.target > 0", label: 'change beat: the changing note and the target outline appear in both; no flag has moved yet'},
    {at: 0.55, fn: 's.a.holdChg !== null && s.b.holdChg !== null && s.a.hand.y !== s.b.hand.y', label: 'parallel: the same hand carries the same flag in both scenes, along different paths'},
    {at: 1, fn: "s.a.atChg === s.samePassage && s.a.band === 1 && s.a.ring === 0 && s.b.atChg === s.openPassage && s.b.ring === 1 && s.b.slot === 1 && s.b.band === 0 && s.a.atOther === s.b.atOther", label: 'the one changed fact: A level with the other flag (band), B alone on the open passage (ring + empty outline)'},
    {at: 1, fn: 's.guide === 1 && s.allReached && s.labelsFit', label: 'guide joins the differing flag; labels fit; all IK targets reached'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.a.band === 1 && s.b.ring === 1 && s.b.slot === 1 && s.a.atChg !== s.b.atChg', label: 'labels hidden: the difference still reads'},
    {at: 1, params: ALT, fn: "s.changer === 'a' && s.a.atChg === 0 && s.b.atChg === 2 && s.a.band === 1 && s.b.ring === 1", label: 'alternative: professional A is the one whose flag changes'},
  ],
});

identicalBeforeChange('LAW-0167', 0.17);

suppliedTextSuite('LAW-0167', {
  fields: "const d = p.props.document; const chg = p.props.open.by; const other = chg === 'a' ? 'b' : 'a'; return [...p.actors.map(a => a.name), p.roles.a, p.roles.b, d.reference, d.title, ...d.passages.map(x => x.ref), ...d.passages.map(x => x.text), other === 'a' ? p.props.same.noteA : p.props.same.noteB, chg === 'a' ? p.props.same.noteA : p.props.same.noteB, p.props.open.note, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];",
  content: "const d = p.props.document; return [...p.actors.map(a => a.name), ...d.passages.map(x => x.text), p.props.same.noteA, p.props.same.noteB, p.props.open.note, p.scenarioA.label, p.scenarioB.label, p.changedFact];",
  captions: 'return ["no conclusion drawn", "sin conclusión"];',
});

ratioChecks('LAW-0167', 'labels fit, scenes large, hands reach', [
  {at: [1], fn: 's.labelsFit && s.allReached', label: 'hold: labels fit; all IK targets reached'},
  // stage = both people + table + page (bubble excluded): >= 40 % of the width side by side, full width when stacked
  // rendered check: no bubble (body), strip, guide or scenario header covers any person's head/face
  // or either page — equal visibility of both professionals
  {at: [0.35, 0.6, 1], dom: `(() => {
    const R = n => { const e = svg.querySelector('[data-node="' + n + '"]'); return e && visible(e) ? e.getBoundingClientRect() : null; };
    const px = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width; // 1 output pixel on screen
    const hit = (a, b) => a && b && a.width > 0 && b.width > 0 && a.left < b.right - px && b.left < a.right - px && a.top < b.bottom - px && b.top < a.bottom - px;
    const heads = ['A-A-head', 'A-B-head', 'B-A-head', 'B-B-head'].map(R);
    const pages = ['A-doc', 'B-doc'].map(R);
    const cards = ['A-bub-body', 'B-bub-body', 'plate', 'guide-chip', 'hdr0-txt', 'hdr1-txt'].map(R);
    return heads.every(Boolean) && cards.every(c => !c || (heads.every(h => !hit(c, h)) && pages.every(q => !hit(c, q))));
  })()`, label: 'no bubble, strip, guide or header covers a head, a face or a page (rendered boxes)'},
  // rendered check: the guide ring surrounds only its own flag (strictly inside, with clearance) and
  // touches no other flag, hand or head; the lettered badge sits clear of every flag, hand and head
  {at: [1], dom: `(() => {
    const R = n => { const e = svg.querySelector('[data-node="' + n + '"]'); return e ? e.getBoundingClientRect() : null; };
    // tolerances in output pixels (1080p), converted to the slot's screen scale
    const px = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    const hit = (a, b) => a && b && a.left < b.right - 0.5 * px && b.left < a.right - 0.5 * px && a.top < b.bottom - 0.5 * px && b.top < a.bottom - 0.5 * px;
    const inside = (a, o, m) => a.left >= o.left + m * px && a.right <= o.right - m * px && a.top >= o.top + m * px && a.bottom <= o.bottom - m * px;
    let ok = true;
    for (const K of ['A', 'B']) {
      const ring = R(K + '-ringrect'), badge = R(K + '-ringbadge');
      if (!ring || !badge) return false;
      const own = R(K + '-f-chg'), other = R(K + '-f-other');
      const hands = ['A', 'B'].flatMap(p => ['near', 'far'].map(a => R(K + '-' + p + '-' + a + '-hand')));
      const heads = ['A', 'B'].map(p => R(K + '-' + p + '-head'));
      if (!inside(own, ring, 2)) ok = false;
      if (hit(ring, other) || hands.some(x => hit(ring, x)) || heads.some(x => hit(ring, x))) ok = false;
      if ([own, other, ...hands, ...heads].some(x => hit(badge, x))) ok = false;
    }
    return ok;
  })()`, label: 'guide ring encloses only its flag; ring and badge clear of flags, hands and heads (rendered boxes)'},
  {at: [1], fn: "s.arrangement !== 'column' || s.figureK >= 0.62", label: 'stacked scenes keep large figures (never tiny people beside a stretched page)'},
  {at: [1], fn: "s.arrangement === 'column' ? s.stageW >= 0.9 : s.stageW >= 0.4", label: 'each scene is >= 40 % of the width side by side, full width when stacked'},
]);

// Round-3 review: with labels hidden in the square frame the two scenes (side by side, same layout
// family) fill the caption-safe box: rendered at the hold in every preset, the union box of both scenes
// (wall panels, figures, table, page, bubbles) covers ≥ 65 % of the safe-box height, and every person is
// ≥ 20 % of the frame height.
test('LAW-0167: labels hidden in 1:1 — scenes fill ≥ 65 % of the safe-box height, people ≥ 20 % of the frame (rendered)', async ({page}) => {
  test.setTimeout(120000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const res = await page.evaluate(async ([ps]) => {
    const def = await window.__lib.load('LAW-0167');
    const out = [];
    for (const pr of ps) {
      const el = document.createElement('div'); el.className = 'slot'; document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: 1080, height: 1080, instanceId: 'fill', params: {...pr.params, textVisibility: 'none'}});
      await x.ready;
      x.seek(x.durationMs);
      const svg = el.querySelector('svg');
      const sa = x.getState({bounds: false}).params.safeArea;
      const fr = svg.getBoundingClientRect();
      const safeH = fr.height * (1 - sa.top - sa.bottom);
      const rects = [...svg.querySelectorAll('[data-node]')].filter(e => /^(A|B)-(wall|doc|bub-body|A|B)$/.test(e.getAttribute('data-node'))).map(e => e.getBoundingClientRect()).filter(r => r.height > 0);
      const top = Math.min(...rects.map(r => r.top)), bottom = Math.max(...rects.map(r => r.bottom));
      const people = ['A-A', 'A-B', 'B-A', 'B-B'].map(n => svg.querySelector(`[data-node="${n}"]`).getBoundingClientRect().height / fr.height);
      out.push({k: pr.name, cover: (bottom - top) / safeH, people: Math.min(...people)});
      x.destroy(); el.remove();
    }
    return out;
  }, [presetsFor('LAW-0167')]);
  for (const r of res) {
    expect.soft(r.cover, `scene union / safe-box height [${r.k}]`).toBeGreaterThanOrEqual(0.65);
    expect.soft(r.people, `smallest person / frame height [${r.k}]`).toBeGreaterThanOrEqual(0.2);
  }
});
