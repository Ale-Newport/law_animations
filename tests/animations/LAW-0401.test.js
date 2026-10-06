// LAW-0401 — Mapa de proposiciones · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (both hands, every evidence card's grip point and every thread
// end move continuously), anchoring of objects (whatever the analyst holds — a card or a thread end — sits in the
// analyst's hand on every frame; the witness holds her card until the hand-off at a shared point) and the
// transformation recognisable with labels hidden (the cards end pinned on the board and the threads joined).
// Timing (u): rest 0–0.15 · action 0.15–0.725 (hand-off, turn, pin, join threads; then the table pieces) ·
// notes 0.745–0.80 · state 0.75–0.805; still from 0.805.
// Legal: links as supplied (solid = direct support, dashed = disputed inference); nothing weighed or concluded.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0401';

contractSuite(ID, {
  continuity: ['handA', 'handW', 'ev0', 'ev1', 'ev2', 'te0', 'te1', 'te2', 'te3'],
  attach: [
    {from: 0, to: 1, a: 'handA', b: 'heldGrip', tol: 1.5},
    {from: 0, to: 1, a: 'handA', b: 'heldThread', tol: 1.5},
    {from: 0, to: 0.15, a: 'handW', b: 'ev0', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.phase === 'rest' && s.holders[0] === 'witness' && s.holders[1] === 'table' && s.threads.every(t => t === 'loose')", label: 'rest: the witness holds her card, the slip lies on the table, every thread hangs loose'},
    {at: 0.145, fn: "s.phase === 'rest' && s.held === null", label: 'nothing moves during the rest beat'},
    {at: 1, fn: "s.holders.every(h => h === 'board') && s.threads.every(t => t === 'joined') && s.allReached && s.problems.length === 0", label: 'hold: every card pinned, every supplied thread joined; composition fits'},
    {at: 1, fn: "s.linkKinds.join() === 'direct,direct,disputed'", label: 'the thread styles follow the supplied link kinds only'},
    {at: 1, params: {finalState: 'pinned'}, fn: "s.holders.every(h => h === 'board') && s.threads.every(t => t === 'loose')", label: 'pinned: cards on the board, threads left loose'},
    {at: 1, params: {finalState: 'pending'}, fn: "s.holders[0] === 'witness' && s.holders[1] === 'table'", label: 'pending: nothing is placed'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.holders.some(h => h !== 'board')", label: 'actionProgress freezes the action part-way'},
    {at: 0.1, fn: "s.phase === 'rest' && s.holders[0] === 'witness'", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [...p.claims.map(c => c.id), ...p.claims.map(c => c.text), ...p.evidence.map(e => e.id), ...p.evidence.map(e => e.label), ...p.uncertainties, p.labels.key, p.actorLabels.a, p.actorLabels.b, p.objectLabels.board, p.objectLabels.thread, p.objectLabels.magnifier, ...p.annotations.map(a => a.text), ...(p.stateCaption ? [p.stateCaption] : [])];",
  content: 'return [...p.claims.map(c => c.text), ...p.evidence.map(e => e.label), ...p.uncertainties];',
  captions: 'return [p.actorLabels.a, p.actorLabels.b, p.objectLabels.board, p.objectLabels.thread, p.objectLabels.magnifier];',
});

ratioChecks(ID, 'held props stay in hand, hands within reach, composition fits', [
  {at: times(0, 1, 0.005), fn: '!s.heldGrip || Math.hypot(s.heldGrip.x - s.handA.x, s.heldGrip.y - s.handA.y) < 1.5', label: 'a held card sits in the analyst\'s hand'},
  {at: times(0, 1, 0.005), fn: '!s.heldThread || Math.hypot(s.heldThread.x - s.handA.x, s.heldThread.y - s.handA.y) < 1.5', label: 'a held thread end sits in the analyst\'s hand'},
  {at: times(0, 1, 0.01), fn: 's.allReached', label: 'the hands stay within reach'},
  {at: [1], fn: 's.problems.length === 0', label: 'a composition fits'},
  {at: [1], fn: "P.finalState !== 'linked' || s.threadEnds.every((e, i) => Math.hypot(e.x - s.ends[i].e.x, e.y - s.ends[i].e.y) < 0.6)", label: 'every joined thread ends on its evidence card\'s eyelet'},
  {at: [1], fn: '!s.cards.some(c => c.x < s.mag.x + s.mag.w && c.x + c.w > s.mag.x && c.y < s.mag.y + s.mag.h && c.y + c.h > s.mag.y)', label: 'the parked magnifier does not lie on a card'},
]);

// Every count of claims / evidence (1..3), links (1..4) and every evidence kind composes at every ratio.
test(`${ID}: every array count and evidence kind composes at every ratio`, async ({page}) => {
  test.setTimeout(180000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    const kinds = ['witness', 'document', 'photo', 'object'];
    const combos = [];
    for (const nc of [1, 2, 3]) for (const ne of [1, 2, 3]) {
      const claims = Array.from({length: nc}, (_, i) => ({id: `P${i + 1}`, text: `Claim ${i + 1} as alleged (fictional)`}));
      const evidence = Array.from({length: ne}, (_, j) => ({id: `E${j + 1}`, label: `Item ${j + 1} (fictional)`, kind: kinds[(j + nc) % 4]}));
      const links = [];
      for (let q = 0; q < Math.min(4, nc * ne); q++) links.push({evidence: q % ne, claim: (q + Math.floor(q / ne)) % nc, kind: q % 2 ? 'disputed' : 'direct'});
      combos.push({claims, evidence, links, uncertainties: nc === 3 ? ['Open point one (as supplied)', 'Open point two (as supplied)'] : []});
    }
    combos.push({links: [{evidence: 0, claim: 0, kind: 'disputed'}], annotations: []});
    combos.push({evidence: [{id: 'E1', label: 'Photo (fictional)', kind: 'photo'}, {id: 'E2', label: 'Key (fictional)', kind: 'object'}], links: [{evidence: 1, claim: 1, kind: 'direct'}]});
    for (const params of combos) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'none']) {
      const s = def.evaluate({width: w, height: h, timeMs: def.defaultParams.durationMs, params: {...params, textVisibility: tv}}).semantic;
      if (s.problems.length || !s.holders.every(x => x === 'board') || s.ew < 40 || s.k < 0.4) out.push(`${JSON.stringify(params).slice(0, 80)} ${w}x${h} ${tv}: ${s.problems.join(',')} ew=${s.ew} k=${s.k}`);
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Labels hidden: no visible text, yet the cards end on the board and the threads are joined.
test(`${ID}: labels hidden — no visible text; the evidence ends pinned and joined`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const res = [];
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {textVisibility: 'none'}}); await x.ready;
      const svg = x.element;
      const op = e => { let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
      let text = 0;
      for (const u of [0, 0.3, 0.6, 1]) { x.seek(u * x.durationMs); text += [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length; }
      x.seek(0); const s0 = x.getState({bounds: false}).semantic;
      x.seek(x.durationMs); const s1 = x.getState({bounds: false}).semantic;
      res.push({text, moved: Math.hypot(s1.ev0.x - s0.ev0.x, s1.ev0.y - s0.ev0.y), holders: s1.holders, threads: s1.threads});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  for (const r of out) {
    expect(r.text).toBe(0);
    expect(r.moved).toBeGreaterThan(150);
    expect(r.holders.every(h => h === 'board')).toBe(true);
    expect(r.threads.every(t => t === 'joined')).toBe(true);
  }
});

// Visible text never under 16 px at any moment (cards never scale text down while moving).
test(`${ID}: visible text stays >= 16 px at every moment (1080p)`, async ({page}) => {
  test.setTimeout(120000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h}); await x.ready;
      const svg = x.element;
      const op = e => { let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
      const k = 1080 / Math.min(w, h);
      for (let i = 0; i <= 40; i++) {
        x.seek((i / 40) * x.durationMs);
        const rootM = svg.getScreenCTM();
        for (const t of svg.querySelectorAll('[data-layer="scene"] text')) {
          if (op(t) < 0.3 || !t.textContent.trim()) continue;
          const m = rootM.inverse().multiply(t.getScreenCTM());
          const px = parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * k;
          if (px < 15.9) out.push(`${w}x${h} u=${i / 40}: "${t.textContent.slice(0, 20)}" ${px.toFixed(1)}px`);
        }
      }
      x.destroy(); el.remove();
    }
    return out;
  }, ID);
  expect(bad, bad.slice(0, 10).join('\n')).toEqual([]);
});

test(`${ID}: cold create() of long-labels-stress stays under ~1 s in every ratio`, async ({browser}) => {
  const stress = presetsFor(ID).find(p => p.name === 'long-labels-stress').params;
  for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
    const page = await browser.newPage();
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const ms = await page.evaluate(async ([id, params, w, h]) => {
      const def = await window.__lib.load(id);
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const t0 = performance.now();
      const x = def.create(el, {width: w, height: h, params}); await x.ready; x.seek(x.durationMs);
      const dt = performance.now() - t0; x.destroy(); return dt;
    }, [ID, stress, w, h]);
    await page.close();
    expect(ms).toBeLessThan(1000);
  }
});
