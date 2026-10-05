// LAW-0215 — Sala física y remota · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact is modified (only where the focus
// participant appears — at their room seat or in a window at the room edge — and with it their route or link),
// and no legal consequence is invented (no winner, score, tick or cross; the neutral note says no conclusion).
// Timing (u): identical base until the change (0.19–0.34: a solid ring on the chair in the room scenario, a
// screen bezel around the participant's own place in the window scenario, drawn at the same time); scenario labels
// 0.34–0.39; the same arrivals with the same start times in A and B inside 0.41–0.74; labels once seated; guide
// 0.77–0.83; notes 0.80–0.86; everything still from u ≈ 0.86.
// Equal weight (strict): the same person size, label size, stroke and timing in A and B; links are solid.
// Coordinator decision (standing stress rule, 2026-09-26): the long-labels-stress texts are capped — see the
// `coordinatorDecision` note in LAW-0215.presets.json for the measurements (full-length texts: 41.9 px people in 1:1).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0215';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const PEOPLE = ['A', 'B'].flatMap(k => [0, 1, 2, 3].map(i => `${k}p${i}`));

contractSuite(ID, {
  continuity: PEOPLE,
  attach: ['A', 'B'].flatMap(k => [0, 1].map(i => ({from: 0.76, to: 1, a: `${k}p${i}`, b: `${k}seat${i}`, tol: 0.5}))),
  semantic: [
    {at: 0.1, fn: "s.scenes === 2 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.lookA.header === 0 && s.lookA.bezel === 0 && s.lookA.ring === 0 && s.A.states.every(x => x === 'waiting')", label: 'base: two identical complete scenes, nobody moved, no change drawn, no scenario label yet'},
    {at: 0.27, fn: "s.change > 0 && s.change < 1 && s.lookA.ring > 0 && s.lookB.bezel > 0 && s.lookA.bezel === 0 && s.lookB.ring === 0 && JSON.stringify(s.lookA.people) === JSON.stringify(s.lookB.people)", label: 'the change: A rings the chair in the room, B frames the own place as a window, at the same time; nobody moves yet'},
    {at: 0.4, fn: "s.change === 1 && s.lookA.header === 1 && s.lookB.header === 1", label: 'the scenario labels appear once the change is drawn'},
    {at: 0.5, fn: "s.A.states.filter((x, i) => i !== s.focusIndex).join() === s.B.states.filter((x, i) => i !== s.focusIndex).join()", label: 'parallel: the shared participants are at the same stage in A and B'},
    {at: 1, fn: "s.A.states.every(x => x === 'seated') && s.B.states.every(x => x === 'seated') && s.A.labels.every(l => l === 1) && s.B.labels.every(l => l === 1)", label: 'both: everyone in place, every label shown'},
    {at: 1, fn: "s.appearsA === 'room' && s.appearsB === 'window' && (s.focusA.x !== s.focusB.x || s.focusA.y !== s.focusB.y) && JSON.stringify(s.lookA.people.filter((q, i) => i !== s.focusIndex)) === JSON.stringify(s.lookB.people.filter((q, i) => i !== s.focusIndex))", label: 'only the focus participant differs (their place: geometry, not only text); everyone else is identical'},
    {at: 1, fn: 's.guideShown === 1 && s.noteShown === 1 && s.allReached', label: 'guide joins the changed detail; neutral note shown'},
    {at: 1, params: {scenarioB: {label: 'B', caption: 'x', appears: 'room'}}, fn: 'JSON.stringify(s.lookA.people) === JSON.stringify(s.lookB.people) && s.lookA.bezel === s.lookB.bezel', label: 'identical supplied places give identical scenes (nothing invented)'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.focusA.x !== s.focusB.x && s.A.states.every(x => x === 'seated')", label: 'labels hidden: the difference still reads'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.appearsA === 'window' && s.appearsB === 'room' && s.A.states.length === 3", label: 'alternative: window in A, room in B, three participants'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: "const seats = p.routes.map(r => p.seats[r.seat] && p.seats[r.seat].label).filter(Boolean); return [p.courts.building, p.courts.room, ...seats, p.labels.mainDoor, p.labels.key, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];",
  content: "const seats = p.routes.map(r => p.seats[r.seat] && p.seats[r.seat].label).filter(Boolean); return [...seats, p.scenarioA.label, p.scenarioB.label, p.changedFact, ...p.sharedFacts];",
  captions: 'return [p.scenarioA.caption, p.scenarioB.caption, p.comparisonLabels.guide, p.comparisonLabels.neutral, p.labels.mainDoor];',
});

const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const HEADS = "const heads = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-p\\d+-head$/.test(e.getAttribute('data-node'))).map(bx);";
const NO_CARD_ON_FACE = `(() => { ${K} ${BOX} ${HEADS}
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^([AB]-lab\\d+-body|[AB]-door-cap-body|hdr\\d|guide-card|strip)$/.test(e.getAttribute('data-node')) && visible(e)).map(bx);
  return heads.length > 0 && cards.every(c => heads.every(h => !hit(c, h, 1)));
})()`;
const LABEL_OWNS = `(() => { ${K} ${BOX} ${HEADS}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-lab\\d+$/.test(e.getAttribute('data-node')) && visible(e));
  if (!labs.length) return false;
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
  for (const lab of labs) {
    const nm = lab.getAttribute('data-node');
    const body = bx(svg.querySelector('[data-node="' + nm + '-body"]'));
    const pb = bx(svg.querySelector('[data-node="' + lab.getAttribute('data-owner') + '"]'));
    const gap = Math.max(0, Math.max(pb.l - body.r, body.l - pb.r), Math.max(pb.t - body.b, body.t - pb.b)) / K;
    if (gap > 40) return false;
    const line = svg.querySelector('[data-node="' + nm + '-lead"]');
    const m = line.getScreenCTM();
    const A = new DOMPoint(+line.getAttribute('x1'), +line.getAttribute('y1')).matrixTransform(m), B = new DOMPoint(+line.getAttribute('x2'), +line.getAttribute('y2')).matrixTransform(m);
    if (!(B.x >= pb.l - 2 && B.x <= pb.r + 2 && B.y >= pb.t - 2 && B.y <= pb.b + 2)) return false;
    const pts = Array.from({length: 12}, (_, j) => ({x: A.x + (B.x - A.x) * (0.1 + 0.8 * j / 11), y: A.y + (B.y - A.y) * (0.1 + 0.8 * j / 11)}));
    const others = [...texts.filter(t => !lab.contains(t)).map(bx), ...heads];
    if (pts.some(q => others.some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b))) return false;
  }
  return true;
})()`;
const PEOPLE_SIZE = `(() => { ${K}
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-p\\d+$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); const r = e.getBoundingClientRect(); return Math.max(hd.width, hd.height) / K >= 26 && Math.max(r.width, r.height) / K >= 60; });
})()`;
// equal visual weight between A and B (and between room and window participants): one person scale, one label
// font size, one chip stroke; the two scenes are drawn at the same scale
const EQUAL_WEIGHT = `(() => {
  const scales = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-p\\d+$/.test(e.getAttribute('data-node'))).map(e => { const m = e.getScreenCTM(); return Math.hypot(m.a, m.b); });
  const fonts = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-lab\\d+-text$/.test(e.getAttribute('data-node'))).map(e => e.getAttribute('font-size'));
  const strokes = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-lab\\d+-body$/.test(e.getAttribute('data-node'))).map(e => e.getAttribute('stroke-width') + '/' + (e.getAttribute('stroke-dasharray') || ''));
  const planA = svg.querySelector('[data-node="A-plan"]').getScreenCTM(), planB = svg.querySelector('[data-node="B-plan"]').getScreenCTM();
  return scales.length > 1 && Math.max(...scales) / Math.min(...scales) < 1.005 && new Set(fonts).size <= 1 && new Set(strokes).size <= 1 && Math.abs(Math.hypot(planA.a, planA.b) - Math.hypot(planB.a, planB.b)) < 1e-6;
})()`;
// links solid (only the draw-on dash), one width; no dashes anywhere on the compared places (ring, bezel, guide)
const SOLID = `(() => {
  const lines = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-link\\d+-line$/.test(e.getAttribute('data-node')));
  if (new Set(lines.map(e => e.getAttribute('stroke-width'))).size > 1) return false;
  const solid = e => { const da = (e.getAttribute('stroke-dasharray') || '').split(/[ ,]+/).map(Number); return !da[0] || da[0] >= e.getTotalLength() - 1; };
  const marks = [...svg.querySelectorAll('[data-node]')].filter(e => /^([AB]-link\\d+-line|[AB]-ring|[AB]-bezel|guide-lead\\d)$/.test(e.getAttribute('data-node')));
  return marks.every(solid);
})()`;
// two scenes, each >= 40 % of the width side by side or full width when stacked
const SCENE_SHARE = `(() => {
  const vb = svg.viewBox.baseVal;
  const a = svg.querySelector('[data-node="A-plan"]').getBoundingClientRect(), b = svg.querySelector('[data-node="B-plan"]').getBoundingClientRect();
  // measured against the whole FRAME width (not the caption-safe box)
  const W = vb.width * svg.getScreenCTM().a;
  const stacked = Math.abs(a.left - b.left) < 4;
  return stacked ? Math.min(a.width, b.width) >= 0.8 * W : Math.min(a.width, b.width) >= 0.4 * W;
})()`;
// the guide leaders cross no head and no text (other than their own chip)
const GUIDE_CLEAR = `(() => { ${K} ${BOX} ${HEADS}
  const card = svg.querySelector('[data-node="guide-card"]');
  if (!card || !visible(card)) return true;
  const cb = bx(card);
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]') && !t.closest('[data-node="guide"]')).map(bx);
  for (const ln of svg.querySelectorAll('[data-node^="guide-lead"]')) {
    const m = ln.getScreenCTM(), L = ln.getTotalLength();
    for (let j = 2; j < 58; j++) { const q = ln.getPointAtLength((L * j) / 60).matrixTransform(m); if (q.x > cb.l - 2 && q.x < cb.r + 2 && q.y > cb.t - 2 && q.y < cb.b + 2) continue; if ([...texts, ...heads].some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b)) return false; }
  }
  return true;
})()`;
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
const IN_FRAME = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; return p1.x >= -1 && p1.y >= -1 && p2.x <= vb.width + 1 && p2.y <= vb.height + 1; })()";
const OPAQUE = "[...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-p\\d+$/.test(e.getAttribute('data-node'))).every(e => visible(e) && !e.getAttribute('opacity'))";

ratioChecks(ID, 'cards off faces, labels own their people, equal weight, solid marks, large scenes and people', [
  {at: times(0, 1, 0.05), dom: NO_CARD_ON_FACE, label: 'rendered: no card, chip, header or strip covers a head'},
  {at: [0.86, 1], tv: ['all'], dom: LABEL_OWNS, label: 'rendered: each label within 40 px of its own participant, its leader ends on them and crosses no text or head'},
  {at: times(0, 1, 0.1), dom: PEOPLE_SIZE, label: 'rendered: people >= 60 px across and heads >= 26 px (1080p) at every sampled time'},
  {at: [0, 0.5, 1], dom: EQUAL_WEIGHT, label: 'rendered: A and B share one scale; room and window participants one person scale, one label size, one chip stroke'},
  {at: times(0.2, 1, 0.1), dom: SOLID, label: 'rendered: links, ring, bezel and guide are solid (no dashes), links of one width'},
  {at: [0, 1], dom: SCENE_SHARE, label: 'rendered: each scene >= 40 % of the FRAME width side by side, >= 80 % of it when stacked'},
  {at: [1], tv: ['all'], dom: GUIDE_CLEAR, label: 'rendered: the guide leaders cross no head and no other text'},
  {at: [1], dom: FILL, label: 'rendered: the two scenes and the strip fill the caption-safe box'},
  {at: times(0, 1, 0.1), dom: IN_FRAME, label: 'rendered: nothing leaves the frame'},
  {at: times(0, 1, 0.1), dom: OPAQUE, label: 'rendered: people are always whole and opaque'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);

test.describe(`${ID} text size over time`, () => {
  test(`${ID}: every visible text >= 16 px (>= 19.5 px in baseline and baseline-es) at every sampled u`, async ({page}) => {
    test.setTimeout(300000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
        const floor = ['default', 'baseline-illustrative', 'baseline-es'].includes(pr.name) ? 19.5 : 16;
        for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: pr.params});
          await x.ready;
          const svg = x.element;
          const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
          for (let u = 0; u <= 1.0001; u += 0.02) {
            x.seek(u * x.durationMs);
            const s0 = svg.getScreenCTM().a;
            for (const t of svg.querySelectorAll('text')) {
              if (t.closest('[data-layer="content-notice"]') || eff(t) < 0.05 || !(t.textContent || '').trim()) continue;
              const b = t.getBoundingClientRect();
              if (b.width < 0.5) continue;
              const fs = parseFloat(getComputedStyle(t).fontSize);
              const pxs = fs * (t.getScreenCTM().a / s0) * 1080 / Math.min(w, h);
              if (pxs < floor - 0.05) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: "${t.textContent.slice(0, 24)}" ${pxs.toFixed(1)} px < ${floor}`);
            }
          }
          x.destroy();
          el.remove();
        }
      }
      return [...new Set(out)].slice(0, 40);
    }, [ID, presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

// Item 14 + combination rules: the schema offers only the places the compact room draws (front, left1, left2, win1,
// win2), and the combination rules (contrastProblems in LAW-0215.js) reject what the two scenes cannot draw cleanly.
// Every seat subset × focus seat × scenario pair × ratio × labels shown/hidden is enumerated at the hold: an accepted
// combination renders with semantic.problems empty and every supplied participant in both scenes; any other is
// rejected by create()/evaluate()/setParams() with a ParamError (never drawn with overlaps, never dropped silently).
test(`${ID}: every valid seat and focus combination renders cleanly at the hold in every ratio; the rest are rejected`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const res = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const SL = ['front', 'left1', 'left2', 'win1', 'win2'];
    const LAB = {front: 'Presiding seat', left1: 'Participant A', left2: 'Participant C', win1: 'Participant B', win2: 'Participant D'};
    const out = {bad: [], dropped: [], rejected: 0, accepted: 0, notParamError: [], slotsSeen: new Set(), shouldReject: [], shouldAccept: []};
    for (let m = 1; m < 32; m++) {
      const slots = SL.filter((_, i) => m & (1 << i));
      if (slots.length < 2) continue;
      const seats = slots.map(slot => ({slot, label: LAB[slot]}));
      for (let f = 0; f < seats.length; f++) for (const [a, b] of [['room', 'window'], ['window', 'room'], ['room', 'room'], ['window', 'window']]) {
        const room = ['front', 'left1', 'left2'].includes(slots[f]);
        const sharedWin = slots.filter((q, i) => i !== f && q.startsWith('win')).length;
        const valid = room && sharedWin <= 1 && slots.length <= 4;
        for (const tv of ['all', 'none']) {
          const params = {seats, routes: seats.map((_, i) => ({seat: i})), focusSeat: f, textVisibility: tv,
            scenarioA: {label: 'Scenario A', caption: 'As supplied', appears: a}, scenarioB: {label: 'Scenario B', caption: 'As supplied', appears: b}};
          for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
            const tag = `${slots.join(',')} focus=${slots[f]} ${a}/${b} ${ratio} labels:${tv}`;
            let st = null;
            try { st = def.evaluate({width: w, height: h, params, timeMs: 7500}); } catch (e) {
              if (e.name !== 'ParamError') out.notParamError.push(`${tag}: ${e.message}`);
              if (valid) out.shouldAccept.push(tag); else out.rejected++;
              break;
            }
            if (!valid) { out.shouldReject.push(tag); break; }
            out.accepted++;
            slots.forEach(q => out.slotsSeen.add(q));
            const s = st.semantic;
            if (s.problems.length) out.bad.push(`${tag}: ${s.problems.join('+')}`);
            if (s.A.states.length !== seats.length || s.B.states.length !== seats.length || !s.A.states.every(q => q === 'seated') || !s.B.states.every(q => q === 'seated')) out.dropped.push(tag);
          }
        }
      }
    }
    // the reviewer's probes and the unsupported places are rejected; so is an invalid setParams on a live instance
    const probe = (slots, f) => ({seats: slots.map(slot => ({slot, label: LAB[slot]})), routes: slots.map((_, i) => ({seat: i})), focusSeat: f});
    const probes = [[['front', 'left1', 'left2', 'win1', 'win2'], 2], [['left1', 'win1', 'left2', 'win2'], 2], [['front', 'win1', 'left2', 'win2'], 2]];
    out.probesRejected = probes.map(([sl, f]) => { try { def.evaluate({params: probe(sl, f)}); return false; } catch (e) { return e.name === 'ParamError'; } });
    out.slotsRejected = ['right1', 'right2', 'win3', 'win4'].map(slot => { try { def.evaluate({params: {seats: [{slot, label: 'X'}, {slot: 'left1', label: 'Y'}], routes: [{seat: 0}, {seat: 1}], focusSeat: 1}}); return false; } catch (e) { return e.name === 'ParamError'; } });
    const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
    const x = def.create(el, {width: 1920, height: 1080});
    await x.ready;
    try { x.setParams(probe(['left1', 'win1', 'left2', 'win2'], 2)); out.setParamsRejected = false; } catch (e) { out.setParamsRejected = e.name === 'ParamError'; }
    out.stillDefault = x.getState({bounds: false}).params.seats.length === def.defaultParams.seats.length;
    x.destroy(); el.remove();
    out.slotsSeen = [...out.slotsSeen].sort();
    return out;
  }, ID);
  expect(res.notParamError, res.notParamError.join('\n')).toEqual([]);
  expect(res.shouldAccept, res.shouldAccept.join('\n')).toEqual([]);
  expect(res.shouldReject, res.shouldReject.join('\n')).toEqual([]);
  expect(res.bad, res.bad.join('\n')).toEqual([]);
  expect(res.dropped, res.dropped.join('\n')).toEqual([]);
  expect(res.accepted).toBeGreaterThan(300);
  expect(res.slotsSeen).toEqual(['front', 'left1', 'left2', 'win1', 'win2']);
  expect(res.probesRejected).toEqual([true, true, true]);
  expect(res.slotsRejected).toEqual([true, true, true, true]);
  expect(res.setParamsRejected).toBe(true);
  expect(res.stillDefault).toBe(true);
});

// Routes are normalised, never rejected: missing seats are appended in seat order, unknown and repeated indices
// are ignored, so every seat is always drawn whatever order list is supplied.
test(`${ID}: the arrival order is normalised (missing appended, unknown and repeated ignored); every seat is drawn`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const res = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const seats = [{slot: 'win1', label: 'Participant B'}, {slot: 'left2', label: 'Participant A'}, {slot: 'front', label: 'Presiding seat'}];
    const out = [];
    for (const routes of [[{seat: 2}], [{seat: 2}, {seat: 2}, {seat: 3}], [{seat: 1}, {seat: 0}, {seat: 2}]]) {
      const st = def.evaluate({width: 1920, height: 1080, params: {seats, routes, focusSeat: 1}, timeMs: 7500});
      out.push({n: st.semantic.A.states.length, seated: st.semantic.A.states.every(q => q === 'seated') && st.semantic.B.states.every(q => q === 'seated'), problems: st.semantic.problems});
    }
    return out;
  }, ID);
  for (const r of res) { expect(r.n).toBe(3); expect(r.seated).toBe(true); expect(r.problems).toEqual([]); }
});

// The gallery's own edit path: the participant count goes 2 -> 3 -> 4 -> 3 -> 2 by editing the Seats JSON only
// (Routes untouched), and every step applies; a combination error caused by a Seats edit is shown on Seats.
test(`${ID}: gallery - Seats alone takes the count 2 -> 3 -> 4 -> 3 -> 2, each step applied; a Seats error shows on Seats`, async ({page}) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('/gallery/');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  await page.fill('#q', ID);
  await page.waitForFunction(q => document.querySelector('#q').value === q && window.__gallery && document.querySelector('#count').textContent.length > 0, ID);
  await page.waitForTimeout(250);
  await page.click(`#opt-${ID}`);
  await page.waitForFunction(i => { const x = window.__gallery.instance; return x && x.id === i && x.isReady && document.querySelector('#param-fields').childElementCount > 0; }, ID);
  const B = {slot: 'win1', label: 'Participant B'}, A = {slot: 'left2', label: 'Participant A'};
  const P = {slot: 'front', label: 'Presiding seat'}, C = {slot: 'left1', label: 'Participant C'};
  const routesBefore = await page.evaluate(() => JSON.stringify(window.__gallery.instance.getState({bounds: false}).params.routes));
  for (const seats of [[B, A, P], [B, A, P, C], [B, A, P], [B, A]]) {
    await page.fill('#f-seats', JSON.stringify(seats, null, 2));
    await page.locator('#f-seats').blur();
    await expect(page.locator('#param-errors')).toBeHidden();
    await expect.poll(() => page.evaluate(() => window.__gallery.instance.getState({bounds: false}).params.seats.length)).toBe(seats.length);
    const drawn = await page.evaluate(() => {
      const x = window.__gallery.instance;
      x.seek(x.durationMs);
      const s = x.getState({bounds: false}).semantic;
      const names = [...x.element.querySelectorAll('[data-node]')].map(e => e.getAttribute('data-node'));
      return {A: names.filter(n => /^A-p\d+$/.test(n)).length, B: names.filter(n => /^B-p\d+$/.test(n)).length, states: s.A.states.length, problems: s.problems};
    });
    expect(drawn, `seats ${seats.length}`).toEqual({A: seats.length, B: seats.length, states: seats.length, problems: []});
  }
  expect(await page.evaluate(() => JSON.stringify(window.__gallery.instance.getState({bounds: false}).params.routes))).toBe(routesBefore);
  // a second shared window is a combination error caused by the Seats edit: it is reported on Seats, not Focus seat
  await page.fill('#f-seats', JSON.stringify([B, A, {slot: 'win2', label: 'Participant D'}], null, 2));
  await page.locator('#f-seats').blur();
  await expect(page.locator('#param-errors')).toContainText('params.seats + params.focusSeat');
  await expect(page.locator('#f-seats')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#f-focusSeat')).toHaveCount(1);
  await expect(page.locator('#f-focusSeat')).not.toHaveAttribute('aria-invalid', 'true');
  expect(await page.evaluate(() => window.__gallery.instance.getState({bounds: false}).params.seats.length)).toBe(2);
  expect(errors).toEqual([]);
});

