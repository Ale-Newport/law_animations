// LAW-0237 — Adaptación de accesibilidad · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion, anchoring of objects (each participant's equipment moves with
// them: the wheelchair under the person, the long cane in their hand; the people stay on their routes: up the ramp,
// up the steps and along the tactile strip, through the doors, to their places), and the transformation (reaching the
// room along the route and the supports) recognisable with the labels hidden.
// Timing (u): rest 0–0.15 (nobody moves); the participants set off in the supplied order from u 0.15, one pace for all,
// each passing the room door after the one before; everyone has arrived by u 0.72; notes and the state tag 0.76–0.83;
// everything is still from u ≈ 0.83.
// Legal / content (strict): no standard, measurement, obligation, compliance or outcome anywhere; people drawn at the
// same size, as active participants; every mark is solid (dashes only on the plan's door-swing arcs, a plan
// convention); no red; the key says no conclusion is drawn; the order carries "sequence as configured (illustrative)".
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0237';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['p0', 'p1'],
  semantic: [
    {at: 0, fn: "s.states.every(q => q === 'waiting') && s.beat === 'rest' && s.doorMain === 0 && s.doorRoom === 0", label: 'rest: everyone waits on the pavement; the doors are closed'},
    {at: 0.145, fn: "s.states.every(q => q === 'waiting') && s.p0.x === s.start0.x && s.p1.y === s.start1.y", label: 'nothing moves during the rest beat'},
    {at: 0.3, fn: "s.states[s.order[0]] === 'moving'", label: 'the first participant in the supplied order is on the move'},
    {at: 1, fn: "s.states.every(q => q === 'arrived') && s.p0.x === s.goal0.x && s.p1.y === s.goal1.y && s.notesShown === 1 && s.problems.length === 0", label: 'hold: everyone has reached their supplied place; notes shown'},
    {at: 0.72, fn: "s.states.every(q => q === 'arrived')", label: 'the main action is complete by u 0.72'},
    {at: 1, fn: "s.via[0] === 'ramp' && s.via[1] === 'steps' && s.modes[0] === 'wheelchair' && s.modes[1] === 'cane'", label: 'the wheelchair user takes the ramp, the long-cane user the steps and the strip'},
    {at: 1, params: {finalState: 'at-door'}, fn: "s.states.every(q => q === 'arrived') && s.goal0.y > s.goal1.y - 400 && s.finalState === 'at-door' && s.doorRoom === 0", label: 'supplied state "at-door": everyone stops in the corridor in front of the room door'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.states.some(q => q !== 'arrived')", label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {routes: [{seat: 1}, {seat: 0}]}, fn: "s.order.join() === '1,0' && s.startTimes[1] < s.startTimes[0]", label: 'the supplied order decides who sets off first'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: "s.states.some(q => q !== 'waiting')", label: 'labels hidden: the same movement happens'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.courts.building, p.courts.room, ...p.seats.map(s => s.label), p.labels.ramp, p.labels.tactile, p.labels.sign, p.labels.key, p.objectLabels.steps, ...[...new Set(p.seats.map(s => s.mode))].map(m => p.actorLabels[m]), ...p.annotations.map(a => a.text)];",
  content: "return [p.courts.building, p.courts.room, ...p.seats.map(s => s.label)];",
  captions: "return [p.labels.ramp, p.labels.tactile, p.labels.sign, p.objectLabels.steps];",
});

// ---------------------------------------------------------------------------------------------
// Rendered checks (every preset × ratio × labels shown/hidden). Distances in px at 1080p.
const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const HEADS = "const heads = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+-head$/.test(e.getAttribute('data-node'))).map(bx);";
const EFF = "const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };";
// visible cards: chips, badges, panel entries, the building name, the state tag
const CARDS = "const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^(lab\\w*-body|room-name-body|bld-name|legend-\\w+|note\\d+|key|cap-\\w+)$/.test(e.getAttribute('data-node')) && eff(e) >= 0.05);";
// no visible card covers a head
const NO_CARD_ON_FACE = `(() => { ${K} ${BOX} ${HEADS} ${EFF} ${CARDS}
  return heads.length > 0 && cards.map(bx).every(c => heads.every(h => !hit(c, h, 1)));
})()`;
// chips and badges in the plan rest on free floor: never on a prop (ramp, steps, strip, sign, table, desk, bench,
// plants) nor on another chip
const CHIPS_OFF_PROPS = `(() => { ${BOX} ${EFF}
  const chips = [...svg.querySelectorAll('[data-node]')].filter(e => /^(lab\\w*-body|room-name-body)$/.test(e.getAttribute('data-node')) && eff(e) >= 0.05).map(bx);
  const props = [...svg.querySelectorAll('[data-node]')].filter(e => /^rm-(ramp|steps|sign|table|desk|bench|plant\\d)$/.test(e.getAttribute('data-node'))).map(bx);
  const strip = [...svg.querySelectorAll('[data-node="rm-tactile"] rect')].map(bx);
  return chips.every((c, i) => [...props, ...strip].every(q => !hit(c, q, 2)) && chips.every((d, j) => j === i || !hit(c, d, 0)));
})()`;
// each hold label: its leader ends on its owner and crosses no other head or chip (when the chips find no place, every
// participant gets a number badge instead, touching them, with the full label in the panel beside the same number)
const LABEL_OWNS = `(() => { ${K} ${BOX} ${HEADS} ${EFF}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^labH\\d+$/.test(e.getAttribute('data-node')) && eff(e) >= 0.5);
  if (!labs.length) return false;
  const bodies = labs.map(l => bx(svg.querySelector('[data-node="' + l.getAttribute('data-node') + '-body"]')));
  for (const [j, lab] of labs.entries()) {
    const nm = lab.getAttribute('data-node');
    const owner = svg.querySelector('[data-node="' + lab.getAttribute('data-owner') + '"]');
    const pb = bx(owner);
    if (lab.getAttribute('data-badge')) {
      // (fallback) a number badge touches its own participant: within 30 px of their body
      const bb = bodies[j];
      const gap = Math.max(0, pb.l - bb.r, bb.l - pb.r, pb.t - bb.b, bb.t - pb.b) / K;
      if (gap > 30) return false;
      continue;
    }
    const line = svg.querySelector('[data-node="' + nm + '-lead"]');
    const m = line.getScreenCTM();
    const A = new DOMPoint(+line.getAttribute('x1'), +line.getAttribute('y1')).matrixTransform(m), B = new DOMPoint(+line.getAttribute('x2'), +line.getAttribute('y2')).matrixTransform(m);
    if (!(B.x >= pb.l - 3 && B.x <= pb.r + 3 && B.y >= pb.t - 3 && B.y <= pb.b + 3)) return false;
    const own = heads[+lab.getAttribute('data-owner').slice(1)];
    const others = [...heads.filter(hh => hh !== own), ...bodies.filter((b, i) => i !== j)];
    for (let t = 0.12; t < 0.9; t += 0.06) { const q = {x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t}; if (others.some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b)) return false; }
  }
  return true;
})()`;
// people are large enough to read (px at 1080p): figure >= 60 across, head >= 26
const PEOPLE_SIZE = `(() => { ${K}
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); const r = e.getBoundingClientRect(); return Math.max(hd.width, hd.height) / K >= 26 && Math.max(r.width, r.height) / K >= 60; });
})()`;
// equal weight: every participant drawn at one scale; one label size and one chip stroke
const EQUAL_WEIGHT = `(() => {
  const sc = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+-at$/.test(e.getAttribute('data-node'))).map(e => { const m = e.getScreenCTM(); return Math.hypot(m.a, m.b); });
  const fonts = [...svg.querySelectorAll('[data-node]')].filter(e => /^labH\\d+-text$/.test(e.getAttribute('data-node'))).map(e => e.getAttribute('font-size'));
  return sc.length > 0 && Math.max(...sc) / Math.min(...sc) < 1.005 && new Set(fonts).size <= 1;
})()`;
// equipment stays with its person: the wheelchair group and the cane move inside the person's own group
const EQUIPMENT = `(() => {
  const wcs = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+-wc$/.test(e.getAttribute('data-node')));
  const canes = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+-cane$/.test(e.getAttribute('data-node')));
  const own = e => { const nm = e.getAttribute('data-node').split('-')[0]; return e.closest('[data-node="' + nm + '-at"]') !== null; };
  if (![...wcs, ...canes].every(own)) return false;
  // the cane starts in the person's hand
  return canes.every(c => { const nm = c.getAttribute('data-node').split('-')[0]; const hd = svg.querySelector('[data-node="' + nm + '-armR-h"]').getBoundingClientRect(); const m = c.getScreenCTM(); const A = new DOMPoint(+c.getAttribute('x1'), +c.getAttribute('y1')).matrixTransform(m); return A.x >= hd.left - 3 && A.x <= hd.right + 3 && A.y >= hd.top - 3 && A.y <= hd.bottom + 3; });
})()`;
// every stroke is solid (the plan's door-swing arcs are the one plan convention allowed a dash)
const SOLID = "[...svg.querySelectorAll('[stroke-dasharray]')].every(e => { const d = e.getAttribute('stroke-dasharray'); if (!d || d === 'none') return true; const n = e.closest('[data-node]'); return !!n && /^rm-d(room|main|side)$/.test(n.getAttribute('data-node')); })";
const NO_RED = `(() => {
  const red = c => { const m = /^#([0-9a-f]{6})$/i.exec(c || ''); if (!m) return false; const n = parseInt(m[1], 16), R = n >> 16, G = (n >> 8) & 255, B = n & 255; return R > 170 && G < 90 && B < 90; };
  return [...svg.querySelectorAll('[fill], [stroke]')].every(e => !red(e.getAttribute('fill')) && !red(e.getAttribute('stroke')));
})()`;
const IN_FRAME = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; return p1.x >= -1 && p1.y >= -1 && p2.x <= vb.width + 1 && p2.y <= vb.height + 1; })()";
const OPAQUE = "[...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+(-at)?$/.test(e.getAttribute('data-node'))).every(e => visible(e) && (!e.getAttribute('opacity') || e.getAttribute('opacity') === '1'))";

ratioChecks(ID, 'cards off faces and props, labels own their people, equipment with its person, solid, no red', [
  {at: times(0, 1, 0.05), dom: NO_CARD_ON_FACE, label: 'rendered: no chip, badge or panel entry covers a head'},
  {at: [0, 0.1, 0.8, 1], dom: CHIPS_OFF_PROPS, label: 'rendered: chips and badges rest on free floor (never on a prop or another chip)'},
  {at: [0.85, 1], tv: ['all'], dom: LABEL_OWNS, label: 'rendered: each hold label ends on its own participant; its leader crosses no other head or chip'},
  {at: [0, 0.1, 0.2, 0.9, 1], dom: PEOPLE_SIZE, label: 'rendered: at rest, build and hold people >= 60 px across, heads >= 26 px (1080p)'},
  {at: [0, 0.5, 1], dom: EQUAL_WEIGHT, label: 'rendered: every participant at one scale; one label size'},
  {at: times(0, 1, 0.1), dom: EQUIPMENT, label: 'rendered: the wheelchair and the cane move with their person; the cane starts in the hand'},
  {at: times(0, 1, 0.1), dom: SOLID, label: 'rendered: every stroke solid (door-swing arcs excepted)'},
  {at: [0, 0.5, 1], dom: NO_RED, label: 'rendered: no red/alarm colour anywhere'},
  {at: times(0, 1, 0.1), dom: IN_FRAME, label: 'rendered: nothing leaves the frame'},
  {at: times(0, 1, 0.1), dom: OPAQUE, label: 'rendered: people are always whole and opaque'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits: every label placed'},
]);

// Frame fill (rest, build and hold, labels on and hidden): the visible content (the plan, the building, panel entries,
// chips) covers > 0.5 of the caption-safe box AREA (40 × 40 grid), and never < 0.3 of the frame for more than 200 ms.
test(`${ID}: content covers > 0.5 of the safe box at rest, build and hold; no < 0.3 frame window over 200 ms`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const res = await page.evaluate(async ([id, ps]) => {
    const def = await window.__lib.load(id);
    const out = [], info = [];
    for (const pr of ps) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
      const vb = svg.viewBox.baseVal, m = svg.getScreenCTM();
      const Fr = {l: m.e + vb.x * m.a, t: m.f + vb.y * m.d, w: vb.width * m.a, h: vb.height * m.d};
      const sa = x.getState({bounds: false}).params.safeArea;
      const S = {l: Fr.l + Fr.w * sa.left, t: Fr.t + Fr.h * sa.top, w: Fr.w * (1 - sa.left - sa.right), h: Fr.h * (1 - sa.top - sa.bottom)};
      const cover = R => {
        const parts = [...svg.querySelectorAll('[data-node]')].filter(e => /^(rm-plan-art|bld|bld-name|legend-\w+|note\d+|key|cap-\w+|lab\w*-body|room-name-body)$/.test(e.getAttribute('data-node')) && eff(e) >= 0.15).map(e => e.getBoundingClientRect());
        let hit = 0;
        for (let a = 0; a < 40; a++) for (let b = 0; b < 40; b++) {
          const px = R.l + (a + 0.5) * R.w / 40, py = R.t + (b + 0.5) * R.h / 40;
          if (parts.some(q => px >= q.left && px <= q.right && py >= q.top && py <= q.bottom)) hit++;
        }
        return hit / 1600;
      };
      for (const u of [0.05, 0.12, 0.9, 1]) {
        x.seek(u * x.durationMs);
        const c = cover(S);
        if (c <= 0.5) out.push(`${pr.name} ${tv} ${ratio} u=${u}: content ${c.toFixed(3)} of the safe box`);
      }
      let run = 0, worst = 0, minC = 1;
      for (let t = 0; t <= x.durationMs; t += 40) {
        x.seek(t);
        const c = cover(Fr);
        minC = Math.min(minC, c);
        if (c < 0.3) { run += 40; worst = Math.max(worst, run); } else run = 0;
      }
      info.push(`${pr.name} ${tv} ${ratio}: min frame coverage ${minC.toFixed(3)}, longest < 0.3 run ${worst} ms`);
      if (worst > 200) out.push(`${pr.name} ${tv} ${ratio}: ${worst} ms under 0.3 of the frame`);
      x.destroy(); el.remove();
    }
    return {out, info};
  }, [ID, presets]);
  console.log(res.info.join('\n'));
  expect(res.out, res.out.join('\n')).toEqual([]);
});

// Text size at EVERY moment: every visible text (effective opacity >= 0.05) is >= 16 px at 1080p at every sampled u,
// and >= 19.5 px in the default, baseline-illustrative and baseline-es presets.
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

// create() is cold-fast: <= 1000 ms in a fresh page for every preset × ratio (AUTHORING item 20)
test(`${ID}: cold create() <= 1 s in every preset × ratio`, async ({browser}) => {
  test.setTimeout(300000);
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const slow = [];
  for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
    const page = await browser.newPage();
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const ms = await page.evaluate(async ([id, w, h, params]) => {
      const def = await window.__lib.load(id);
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const t0 = performance.now();
      const x = def.create(el, {width: w, height: h, params});
      await x.ready;
      return performance.now() - t0;
    }, [ID, w, h, pr.params]);
    if (ms > 1000) slow.push(`${pr.name} ${ratio}: ${Math.round(ms)} ms`);
    await page.close();
  }
  expect(slow, slow.join('\n')).toEqual([]);
});

// Nobody walks through anybody (courts-10 review): at every 1/120 s, in every preset × ratio × labels state, the rendered centres of
// any two participants (their `p{i}-at` groups, template units) stay >= 104 apart — one body (100) plus a little air.
test(`${ID}: participants never overlap while they move or wait (centre distance >= 104 template units)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, ps]) => {
    const def = await window.__lib.load(id);
    const bad = [];
    for (const pr of ps) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      let worst = Infinity, at = 0;
      for (let t = 0; t <= x.durationMs; t += 1000 / 120) {
        x.seek(t);
        const groups = {};
        for (const e of x.element.querySelectorAll('[data-node$="-at"]')) {
          const nm = e.getAttribute('data-node');
          const m = /^(.*?)p(\d+)-at$/.exec(nm);
          const tr = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(e.getAttribute('transform') || '');
          if (!m || !tr) continue;
          (groups[m[1]] = groups[m[1]] || []).push([+tr[1], +tr[2]]);
        }
        for (const pts of Object.values(groups)) for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
          if (d < worst) { worst = d; at = t; }
        }
      }
      if (worst < 104) bad.push(`${pr.name} ${tv} ${ratio}: centres ${worst.toFixed(1)} apart at ${at} ms`);
      x.destroy(); el.remove();
    }
    return bad;
  }, [ID, presets]);
  expect(out, out.join('\n')).toEqual([]);
});

// locale "es" with the default content (courts-10 review): every default left untouched switches to its Spanish
// default, so no English text is drawn anywhere (a supplied value is never replaced).
ratioChecks(ID, 'locale es with default params draws no English', [
  {at: [0.1, 0.3, 0.5, 0.7, 0.9, 1], tv: ['all'], presets: ['baseline-illustrative'], params: {locale: 'es'}, dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Participant|Civic|building|Hearing|room|Room|Ramp|ramp|handrails|Tactile|strip|Wall|sign|supplied|conclusion|drawn|Moves|Walks|wheelchair|cane|Entrance|steps|Steps|Sequence|configured|illustrative|Design|support|Barrier|detected|Only|Same|Changed|winner|outcome|was|Everyone|Connections|relation|has|ends|marks|starts|door|fictional|jurisdiction)\\b/.test(t.textContent))", label: 'no English text with locale es and default params'},
]);
ratioChecks(ID, 'locale es keeps a supplied value', [
  {at: [0.5, 1], tv: ['all'], presets: ['baseline-illustrative'], params: {locale: 'es', courts: {building: 'Zeta Hall (fictional)', room: 'Zeta Room (fictional)'}}, dom: "[...svg.querySelectorAll('text')].some(t => /Zeta/.test(t.textContent))", label: 'a supplied name stays as supplied with locale es'},
]);
