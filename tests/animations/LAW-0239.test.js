// LAW-0239 — Adaptación de accesibilidad · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist; exactly the indicated fact changes (the main entrance: a ramp with
// handrails in A, steps only in B — as supplied — and with it only the wheelchair user's way in); no legal consequence
// is invented to complete the contrast.
// Timing (u): base 0–0.17 (the two plans identical, labels on or off); the change 0.19–0.34 (both entrances ringed at
// the same time with ● / ◆, A's ramp grows in beside the steps); scenario labels 0.34–0.39; the same arrival in
// parallel 0.40–0.76 (the same start times and pace in A and B); guide 0.77–0.83; notes 0.80–0.86; still from 0.86.
// Legal / content (strict): "barrier detected" is only a supplied observation — no standard, measurement, violation,
// compliance or outcome; equal weight (one person scale, one ring stroke, same marker size); no red, no cross, no
// strike, no dash; neither scene preferred; the key says no conclusion is drawn.
// People floor (coordinator, 2026-09-27 courts-10 task): >= 60 px; in the square contrast >= 55 px baseline, >= 45 px
// in the stress preset.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0239';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  semantic: [
    {at: 0.1, fn: "s.lookA === s.lookB && s.ringA === 0 && s.rampA === 0 && s.rampB === 0", label: 'base: two identical complete scenes; no change drawn yet'},
    {at: 0.27, fn: "s.ringA === s.ringB && s.ringA > 0 && JSON.stringify(s.statesA) === JSON.stringify(s.statesB)", label: 'the change: both entrances ringed at the same time; nobody moves yet'},
    {at: 0.4, fn: "s.header === 1 && s.rampA === 1 && s.rampB === 0", label: 'A has the ramp (as supplied), B the steps only'},
    {at: 0.5, fn: "JSON.stringify(s.startsA) === JSON.stringify(s.startsB)", label: 'the same start times in A and B'},
    {at: 1, fn: "s.viaA.join() === 'ramp,steps' && s.viaB.join() === 'side,steps'", label: 'only the wheelchair user’s way in differs (ramp in A, the level side entrance in B); the long-cane user takes the steps in both'},
    {at: 1, fn: "s.statesA.every(q => q === 'arrived') && s.statesB.every(q => q === 'arrived') && s.guide === 1 && s.problems.length === 0", label: 'hold: everyone arrived in both scenes; the guide drawn'},
    {at: 0.76, fn: "s.statesA.every(q => q === 'arrived') && s.statesB.every(q => q === 'arrived')", label: 'the parallel action is complete by u 0.76'},
    {at: 1, params: {scenarioB: {label: 'B', caption: 'x', entrance: 'ramp', wheelchairEntrance: 'main'}}, fn: 's.lookA === s.lookB && s.viaA.join() === s.viaB.join()', label: 'identical supplied states give identical scenes (nothing invented)'},
    {at: 0.6, params: {textVisibility: 'none'}, fn: 's.rampA === 1 && s.rampB === 0 && s.viaA[0] !== s.viaB[0]', label: 'labels hidden: the same difference'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: "return [p.courts.building, p.courts.room, ...p.seats.map(s => s.label), p.labels.ramp, p.labels.tactile, p.labels.sign, p.labels.key, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral].filter(Boolean);",
  content: "return [...p.seats.map(s => s.label), p.scenarioA.label, p.scenarioB.label, p.changedFact];",
  captions: "return [p.labels.ramp, p.labels.tactile, p.labels.sign];",
});

const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const HEADS = "const heads = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-p\\d+-head$/.test(e.getAttribute('data-node'))).map(bx);";
const EFF = "const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };";
const NO_CARD_ON_FACE = `(() => { ${K} ${BOX} ${HEADS} ${EFF}
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^([AB]-b[rh]\\d+-body|hdr\\d|guide-card|notes|names|shared-head|fact\\d|who\\d|legend-\\w+)$/.test(e.getAttribute('data-node')) && eff(e) >= 0.05).map(bx);
  return heads.length > 0 && cards.every(c => heads.every(h => !hit(c, h, 1)));
})()`;
// number badges rest on free floor: never on a prop (ramp, steps, strip, sign, desk, bench, plants) nor on each other
const BADGES_OFF_PROPS = `(() => { ${BOX} ${EFF}
  const out = [];
  for (const k of ['A', 'B']) {
    const bs = [...svg.querySelectorAll('[data-node]')].filter(e => new RegExp('^' + k + '-b[rh]\\\\d+-body$').test(e.getAttribute('data-node')) && eff(e) >= 0.05).map(bx);
    const props = [...svg.querySelectorAll('[data-node]')].filter(e => new RegExp('^' + k + 'rm-(steps|sign|desk|bench|plant\\\\d)$|^' + k + '-ramp$').test(e.getAttribute('data-node')) && eff(e) >= 0.05).map(bx);
    const strip = [...svg.querySelectorAll('[data-node="' + k + 'rm-tactile"] rect')].map(bx);
    out.push(bs.every((c, i) => [...props, ...strip].every(q => !hit(c, q, 2)) && bs.every((d, j) => j === i || !hit(c, d, 0))));
  }
  return out.every(Boolean);
})()`;
// equal weight: every person in A and B at one scale; the two rings one stroke; the two markers the same size
const EQUAL_WEIGHT = `(() => {
  const sc = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-p\\d+-at$/.test(e.getAttribute('data-node'))).map(e => { const m = e.getScreenCTM(); return Math.hypot(m.a, m.b); });
  const rings = ['A', 'B'].map(k => svg.querySelector('[data-node="' + k + '-ring-line"]').getAttribute('stroke-width'));
  // (the ● disc of radius r and the ◆ diamond of half-diagonal 1.2 r have the same visual weight)
  const marks = ['A', 'B'].map(k => svg.querySelector('[data-node="' + k + '-ring-mark"]').firstElementChild.getBBox().width);
  const ratio = marks[1] / marks[0];
  return sc.length > 1 && Math.max(...sc) / Math.min(...sc) < 1.005 && rings[0] === rings[1] && ratio > 1.15 && ratio < 1.25;
})()`;
// every stroke is solid (ring and guide draw-on dashes are single solid runs; door swings are a plan convention)
const SOLID = "[...svg.querySelectorAll('[stroke-dasharray]')].every(e => { const n = e.closest('[data-node]'); const nm = n ? n.getAttribute('data-node') : ''; if (/^[AB]rm-d(room|main|side)$/.test(nm)) return true; const d = e.getAttribute('stroke-dasharray'); if (!d || d === 'none') return true; const v = d.split(/[ ,]+/).map(Number); return v.length === 2 && v[1] >= v[0]; })";
// each scene's rendered width as a share of the FRAME (side by side >= 0.40, stacked >= 0.80)
const SCENE_SHARE = `(() => {
  const vb = svg.viewBox.baseVal;
  const W = vb.width * svg.getScreenCTM().a;
  const a = svg.querySelector('[data-node="Arm-plan-art"]').getBoundingClientRect(), b = svg.querySelector('[data-node="Brm-plan-art"]').getBoundingClientRect();
  const stacked = Math.abs(a.left - b.left) < 4;
  return stacked ? Math.min(a.width, b.width) >= 0.8 * W : Math.min(a.width, b.width) >= 0.4 * W;
})()`;
// the guide leaders cross no head and no text other than their own chip; they never run back over themselves or each
// other (distinct channels)
const GUIDE_CLEAR = `(() => { ${K} ${BOX} ${HEADS} ${EFF}
  const card = svg.querySelector('[data-node="guide-card"]');
  if (!card || eff(card) < 0.05) return true;
  const cb = bx(card);
  const texts = [...svg.querySelectorAll('text')].filter(t => eff(t) >= 0.05 && (t.textContent || '').trim() && !card.contains(t) && !t.closest('[data-layer="content-notice"]')).map(bx);
  const lines = [...svg.querySelectorAll('[data-node^="guide-l"]')];
  const all = lines.map(ln => { const m = ln.getScreenCTM(), L = ln.getTotalLength(); return Array.from({length: 61}, (_, j) => ln.getPointAtLength((L * j) / 60).matrixTransform(m)); });
  for (const pts of all) {
    for (const q of pts.slice(1, -1)) {
      if (q.x > cb.l - 3 && q.x < cb.r + 3 && q.y > cb.t - 3 && q.y < cb.b + 3) continue;
      if ([...heads, ...texts].some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b)) return false;
    }
  }
  // distinct channels: away from the chip, the two leaders never come within 8 px of each other
  if (all.length === 2) for (const q of all[0].slice(4)) for (const z of all[1].slice(4)) if (Math.hypot(q.x - z.x, q.y - z.y) < 8 * K && !(q.x > cb.l - 12 && q.x < cb.r + 12 && q.y > cb.t - 12 && q.y < cb.b + 12)) return false;
  return true;
})()`;
// "barrier detected" is not penalised: B's plan, its steps and its people are drawn whole and in full colour
const NOT_PENALISED = `(() => { ${EFF}
  return ['Brm-plan-art', 'Brm-steps', 'B-scene'].every(n => { const e = svg.querySelector('[data-node="' + n + '"]'); return e && eff(e) > 0.999; }) && [...svg.querySelectorAll('text')].every(t => !/line-through/.test(t.getAttribute('text-decoration') || ''));
})()`;
const NO_RED = `(() => {
  const red = c => { const m = /^#([0-9a-f]{6})$/i.exec(c || ''); if (!m) return false; const n = parseInt(m[1], 16), R = n >> 16, G = (n >> 8) & 255, B = n & 255; return R > 170 && G < 90 && B < 90; };
  return [...svg.querySelectorAll('[fill], [stroke]')].every(e => !red(e.getAttribute('fill')) && !red(e.getAttribute('stroke')));
})()`;
// people floor (see the header): 60 px; square 55 px baseline / 45 px stress; heads >= 26 px (>= 22 px stress square)
const PEOPLE_SIZE = `(() => { ${K}
  const square = Math.abs(vb.width - vb.height) < 2;
  const stress = [...svg.querySelectorAll('[data-node]')].filter(e => /^A-p\\d+$/.test(e.getAttribute('data-node'))).length > 2;
  const floor = square ? (stress ? 45 : 55) : 60;
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-p\\d+$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); const r = e.getBoundingClientRect(); return Math.max(hd.width, hd.height) / K >= floor * 0.43 && Math.max(r.width, r.height) / K >= floor; });
})()`;
const IN_FRAME = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; return p1.x >= -1 && p1.y >= -1 && p2.x <= vb.width + 1 && p2.y <= vb.height + 1; })()";
const OPAQUE = "[...svg.querySelectorAll('[data-node]')].filter(e => /^[AB]-p\\d+(-at)?$/.test(e.getAttribute('data-node'))).every(e => visible(e) && (!e.getAttribute('opacity') || e.getAttribute('opacity') === '1'))";

ratioChecks(ID, 'equal weight, scene share of the frame, guide channels, not penalised, no red, people, badges off props', [
  {at: times(0, 1, 0.05), dom: NO_CARD_ON_FACE, label: 'rendered: no header, badge, strip entry or guide card covers a head'},
  {at: [0, 0.1, 0.8, 1], dom: BADGES_OFF_PROPS, label: 'rendered: number badges rest on free floor (never on a prop or another badge)'},
  {at: [0, 0.5, 1], dom: EQUAL_WEIGHT, label: 'rendered: every participant at one scale in A and B; one ring stroke; markers the same size'},
  {at: [0.3, 0.6, 1], dom: SOLID, label: 'rendered: solid strokes only (draw-on runs excepted)'},
  {at: [0.1, 0.5, 1], dom: SCENE_SHARE, label: 'rendered: each scene >= 0.40 of the FRAME width side by side, >= 0.80 stacked'},
  {at: [0.85, 1], tv: ['all'], dom: GUIDE_CLEAR, label: 'rendered: the guide leaders cross no head or text and keep distinct channels'},
  {at: [0.5, 1], dom: NOT_PENALISED, label: 'rendered: scene B (barrier detected) drawn whole and in full colour, nothing struck'},
  {at: [0, 0.5, 1], dom: NO_RED, label: 'rendered: no red/alarm colour anywhere'},
  {at: [0, 0.1, 0.2, 0.9, 1], dom: PEOPLE_SIZE, label: 'rendered: people at the floor (60 px; square 55 px baseline, 45 px stress) at rest, build and hold'},
  {at: times(0, 1, 0.1), dom: IN_FRAME, label: 'rendered: nothing leaves the frame'},
  {at: times(0, 1, 0.1), dom: OPAQUE, label: 'rendered: people are always whole and opaque'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);

// Frame fill (rest, build and hold; labels on and hidden): content > 0.5 of the safe box area; never < 0.3 of the frame
// for more than 200 ms
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
        const parts = [...svg.querySelectorAll('[data-node]')].filter(e => /^([AB]rm-plan-art|hdr\d|strip|guide)$/.test(e.getAttribute('data-node')) && eff(e) >= 0.15).map(e => e.getBoundingClientRect()).filter(q => q.width > 0);
        let hit = 0;
        for (let a = 0; a < 40; a++) for (let b = 0; b < 40; b++) {
          const px = R.l + (a + 0.5) * R.w / 40, py = R.t + (b + 0.5) * R.h / 40;
          if (parts.some(q => px >= q.left - 24 && px <= q.right + 24 && py >= q.top - 24 && py <= q.bottom + 24)) hit++;
        }
        return hit / 1600;
      };
      for (const u of [0.05, 0.15, 0.9, 1]) {
        x.seek(u * x.durationMs);
        const c = cover(S);
        info.push(`${pr.name} ${tv} ${ratio} u=${u}: ${c.toFixed(3)}`);
        if (c <= 0.5) out.push(`${pr.name} ${tv} ${ratio} u=${u}: content ${c.toFixed(3)} of the safe box`);
      }
      let run = 0, worst = 0;
      for (let t = 0; t <= x.durationMs; t += 40) {
        x.seek(t);
        if (cover(Fr) < 0.3) { run += 40; worst = Math.max(worst, run); } else run = 0;
      }
      if (worst > 200) out.push(`${pr.name} ${tv} ${ratio}: ${worst} ms under 0.3 of the frame`);
      x.destroy(); el.remove();
    }
    return {out, info};
  }, [ID, presets]);
  console.log(res.info.filter(l => /u=(0.05|1):/.test(l)).join('\n'));
  expect(res.out, res.out.join('\n')).toEqual([]);
});

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
// any two participants (their `A-p{i}-at` / `B-p{i}-at` groups, per scene, template units) stay >= 104 apart — one body (100) plus a little air.
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
