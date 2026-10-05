// LAW-0224 — Organización de turnos · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens holds a second copy of the same plan,
// people, lamps, token and card drawn at the SAME coordinates, cropped to the decisive detail), the change is localised
// (only the card value and, for a turn-state substitution, the token's holder and the two lamps change) and seeking back
// restores exactly the previous datum.
// Windows (u): frame 0.20–0.23 · panel fades out 0.20–0.23 · plan shrinks 0.21–0.25 · lens opens 0.23–0.27 (its copy
// fades in from 30 % open) · strike 0.46–0.50 · dock 0.51–0.55 · new value 0.555–0.585 · pass 0.59–0.68 · copy fades
// out as the lens closes 0.73–0.745 · context datum returns 0.7405–0.7465 · plan grows back and the panel returns
// 0.745–0.772 · marker 0.80–0.84. Where the shrunk plan would carry text under 16 px, the context texts' opacity follows
// their rendered size (gone below ~16.2 px, back above it).
// Review 1: magnification is measured against the context AT REST; one copy of the changed datum at a time; no empty
// lens outline for more than ~200 ms. Round 2: open and close hand-over gaps <= ~200 ms (60 fps, rendered).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0224';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['token'],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.markerShown === 0 && s.contextScale === 1 && s.holder === 'Participant A' && s.focusLamp === 0", label: 'context: A holds the signal; C pending; no lens, no marker'},
    {at: 0.4, fn: 's.lensOpen === 1 && s.datum === \'before\' && s.zoom >= 1.5 && s.stackInCrop && s.lensClearOfPeople && s.lensClearOfSource && s.lensClearOfPlan', label: 'isolate: a real enlargement (>= 1.5x the context at rest) of the detail, clear of every person, the plan and its source'},
    {at: 0.49, fn: "s.datum === 'changing' && s.strike > 0 && s.holder === 'Participant A'", label: 'substitute: the old value is struck before anything changes'},
    {at: 0.586, fn: "s.oldDocked === 1 && s.newShown === 1 && s.holder === 'Participant A' && s.focusLamp === 0", label: 'the old value docks as “was”, the new value shows; the dependent state has not changed yet (cause first)'},
    {at: 0.7, fn: "s.datum === 'after' && s.holder === 'Participant C' && s.focusLamp === 1 && s.holderLamp === 0 && s.lensOpen === 1", label: 'the dependent state follows inside the lens: the token passes to C and C\u2019s lamp lights'},
    {at: 0.8, fn: "s.lensOpen === 0 && s.datum === 'after'", label: 'return: the lens has closed onto the updated context'},
    {at: 1, fn: "s.markerShown === 1 && s.datum === 'after' && s.oldDocked === 1 && s.contextScale === 1 && s.allReached && s.problems.length === 0", label: 'hold: full-size plan, struck old value docked, marker shown'},
    {at: 0.3, fn: "s.datum === 'before' && s.strike === 0 && s.oldDocked === 0 && s.holder === 'Participant A'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "!s.moves && s.holder === 'Participant B' && s.markerShown === 1", label: 'wording substitution: only the card wording changes; nothing moves'},
    {at: 0.66, params: {textVisibility: 'none'}, fn: 's.lensOpen === 1 && s.moves', label: 'labels hidden: the same localised change is visible'},
    {at: 0.5, fn: 's.lensShort >= 0.35 && s.ctxW >= 0.45', label: 'the lens short side >= 35 % of the frame short side; the context keeps >= 45 % of the frame width'},
  ],
});

suppliedTextSuite(ID, {
  fields: 'return [p.courts.building, p.courts.room, ...p.routes.map(i => p.seats[i].label), p.labels.active, p.labels.pending, p.labels.key, p.afterValue, p.contextLabels.context, p.contextLabels.marker];',
  content: 'return [...p.routes.map(i => p.seats[i].label), p.afterValue, p.labels.active, p.labels.pending];',
  captions: 'return [p.contextLabels.context, p.contextLabels.marker];',
});

// ---------------------------------------------------------------------------------------------
// Rendered checks (every preset × ratio × labels shown/hidden). Distances in px at 1080p.
const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const EFF = "const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };";
const HEADS = "const heads = [...svg.querySelectorAll('[data-node$=\"-head\"]')].filter(e => /^cx-p\\d+-head$/.test(e.getAttribute('data-node'))).map(bx);";
// every visible card (seat chips, panel items, notes) is clear of every head
const NO_CARD_ON_FACE = `(() => { ${BOX} ${HEADS}
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^(cx-lab\\d+-body|room-name|bld-name|key|legend-\\w+|marker-note|ctx-caption|lz-border)$/.test(e.getAttribute('data-node')) && visible(e)).map(bx);
  return heads.length > 0 && cards.every(c => heads.every(h => !hit(c, h, 1)));
})()`;
// each chip within 40 px of its own person, the leader ends on that person, crosses no other text, chip or head
const LABEL_OWNS_SEAT = `(() => { ${K} ${BOX} ${HEADS}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^lab\\d+$/.test(e.getAttribute('data-node')) && visible(e));
  if (!labs.length) return false;
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
  for (const lab of labs) {
    const i = lab.getAttribute('data-node').slice(3);
    const body = bx(svg.querySelector('[data-node="lab' + i + '-body"]'));
    const pb = bx(svg.querySelector('[data-node="' + lab.getAttribute('data-owner') + '"]'));
    const gap = Math.max(0, Math.max(pb.l - body.r, body.l - pb.r), Math.max(pb.t - body.b, body.t - pb.b)) / K;
    if (gap > 40) return false;
    const line = svg.querySelector('[data-node="lab' + i + '-lead"]');
    const m = line.getScreenCTM();
    const B = new DOMPoint(+line.getAttribute('x2'), +line.getAttribute('y2')).matrixTransform(m), A = new DOMPoint(+line.getAttribute('x1'), +line.getAttribute('y1')).matrixTransform(m);
    if (!(B.x >= pb.l - 2 && B.x <= pb.r + 2 && B.y >= pb.t - 2 && B.y <= pb.b + 2)) return false;
    const pts = Array.from({length: 10}, (_, j) => ({x: A.x + (B.x - A.x) * (0.1 + 0.8 * j / 9), y: A.y + (B.y - A.y) * (0.1 + 0.8 * j / 9)}));
    const others = [...texts.filter(t => !lab.contains(t)).map(bx), ...labs.filter(o => o !== lab).map(o => bx(svg.querySelector('[data-node="' + o.getAttribute('data-node') + '-body"]'))), ...heads];
    if (pts.some(q => others.some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b))) return false;
  }
  return true;
})()`;
// chips stay off every mark: lamps, the token, note rings, party badges, plants and the tray
const CHIPS_OFF_MARKS = `(() => { ${EFF} ${BOX}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^lab\\d+-body$/.test(e.getAttribute('data-node')) && eff(e) > 0.05).map(bx);
  const marks = [...svg.querySelectorAll('[data-node="notes"] circle, [data-node="notes"] rect, [data-node^="rm-plant"], [data-node^="rm-badge"], [data-node^="rm-lamp"], [data-node="token"], [data-node="rm-tray"]')].filter(e => eff(e) > 0.05 && e.getBoundingClientRect().width > 0.5).map(bx);
  return labs.every(l => marks.every(m => !hit(l, m)));
})()`;
// people and their heads are large enough to read (px at 1080p)
const PEOPLE_SIZE = `(() => { ${K}
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^cx-p\\d+$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); const b = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').parentNode.getBoundingClientRect(); const s = e.getBoundingClientRect(); return hd.width / K >= 26 && Math.min(s.width, s.height) / K >= 60; });
})()`;
// the scene fills the caption-safe box (>= 90 % on its long axis, >= 72 % on the other)
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
const IN_FRAME = "(() => { const vb = svg.viewBox.baseVal; const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); return p1.x >= -1 && p1.y >= -1 && p2.x <= vb.width + 1 && p2.y <= vb.height + 1; })()";
const OPAQUE = "[...svg.querySelectorAll('[data-node]')].filter(e => /^cx-p\\d+$/.test(e.getAttribute('data-node'))).every(e => visible(e) && !e.getAttribute('opacity'))";
// equal weight of the two parties: every party badge the same size; nothing in the plan is dashed
const EQUAL_PARTIES = `(() => {
  const bs = [...svg.querySelectorAll('[data-node^="rm-badge"]')].filter(e => /^rm-badge\\d+$/.test(e.getAttribute('data-node'))).map(e => e.getBoundingClientRect());
  if (bs.length < 2 || bs.some(b => Math.abs(b.width - bs[0].width) > 0.5 || Math.abs(b.height - bs[0].height) > 0.5)) return false;
  return ![...svg.querySelector('[data-node="plan"]').querySelectorAll('*')].some(e => e.getAttribute('stroke-dasharray'));
})()`;
const NO_MARKERS = "!svg.querySelector('[marker-end], marker')";
// the token is always under a hand, or gliding: while someone holds it, one of their hands covers it
const TOKEN_IN_HAND = `(() => { ${BOX}
  const tk = svg.querySelector('[data-node="token"]').getBoundingClientRect();
  const c = {x: (tk.left + tk.right) / 2, y: (tk.top + tk.bottom) / 2};
  const hands = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+-arm[LR]-h$/.test(e.getAttribute('data-node'))).map(e => e.getBoundingClientRect());
  return hands.some(hd => Math.hypot((hd.left + hd.right) / 2 - c.x, (hd.top + hd.bottom) / 2 - c.y) <= tk.width * 0.6);
})()`;
// AUTHORING: baseline presets (baseline-es included) render every visible text >= 19.5 px (1080p) in every ratio
const TEXT_195 = `(() => { ${EFF}
  const s0 = svg.getScreenCTM().a; const vb = svg.viewBox.baseVal;
  const ts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]') && eff(t) >= 0.05 && (t.textContent || '').trim() && t.getBoundingClientRect().width >= 0.5);
  return ts.length > 0 && ts.every(t => parseFloat(getComputedStyle(t).fontSize) * (t.getScreenCTM().a / s0) * 1080 / Math.min(vb.width, vb.height) >= 19.5 - 0.05);
})()`;

// the lens box, rendered: its SMALLER side >= 35 % of the frame's short side
const LENS_SIZE = `(() => { const vb = svg.viewBox.baseVal; const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-node="lz-border"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); return Math.min(p2.x - p1.x, p2.y - p1.y) >= 0.35 * Math.min(vb.width, vb.height); })()`;
// the drawn context (the plan) keeps >= 45 % of the FRAME width at every u
const CONTEXT_WIDE = `(() => { const vb = svg.viewBox.baseVal; const m = svg.getScreenCTM(); const b = svg.querySelector('[data-node="cx-rm-room"]').getBoundingClientRect(); return b.width / m.a >= 0.45 * vb.width; })()`;
// hand-back: while the context grows back, the lens copy is already gone (never both legible)
const HANDBACK = `(() => { ${EFF} const copy = svg.querySelector('[data-node="lz-copy"]'); return eff(copy) < 0.002; })()`;
// no panel text shows under any part of the lens while it opens, holds or closes
const PANEL_CLEAR = `(() => { ${EFF} ${BOX}
  const lz = svg.querySelector('[data-node="lz"]'); if (eff(lz) < 0.002) return true;
  const W0 = bx(svg.querySelector('[data-node="lz-border"]'));
  return [...svg.querySelectorAll('[data-node="panel"] text')].every(t => eff(t) < 0.002 || !(t.textContent || '').trim() || !hit(bx(t), W0));
})()`;
const PEOPLE_45 = PEOPLE_SIZE.replace('>= 26', '>= 19').replace('>= 60', '>= 45');

ratioChecks(ID, 'lens size, context wide, hand-back, people, texts', [
  {at: [0.4, 0.5, 0.6, 0.7], dom: LENS_SIZE, label: 'rendered: the lens short side >= 35 % of the frame short side'},
  {at: times(0, 1, 0.02), dom: CONTEXT_WIDE, label: 'rendered: the drawn plan keeps >= 45 % of the FRAME width at every u'},
  {at: times(0.75, 0.8, 0.005), dom: HANDBACK, label: 'rendered: the lens copy is gone before the context grows back'},
  {at: [...times(0.19, 0.34, 0.005), ...times(0.71, 0.84, 0.005)], dom: PANEL_CLEAR, label: 'rendered: no panel text under any part of the lens'},
  {at: [0, 0.1, 0.19, 0.9, 1], dom: PEOPLE_SIZE, label: 'rendered: at rest, build and hold people >= 60 px across, heads >= 26 px (1080p)'},
  {at: times(0.2, 0.9, 0.05), dom: PEOPLE_45, label: 'rendered: while the lens phase runs every person stays >= 45 px across'},
  {at: times(0, 1, 0.05), dom: NO_CARD_ON_FACE, label: 'rendered: no chip, panel item or lens window covers a head'},
  {at: [0, 0.1, 0.9, 1], tv: ['all'], presets: ['baseline-illustrative', 'baseline-es'], dom: TEXT_195, label: 'rendered: baseline and baseline-es: every visible text >= 19.5 px in every ratio'},
  {at: times(0.2, 0.8, 0.02), fn: 's.lensClearOfPeople && s.lensClearOfSource && s.lensClearOfPlan', label: 'the lens never covers a person, the plan or its own source'},
  {at: times(0.585, 0.71, 0.01), tv: ['all'], fn: 's.newShown === 1 && s.lensOpen === 1', label: 'the new value is readable and still in the lens for >= 400 ms'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);


// review 1 (LAW-0224): rendered checks at 60 fps in every preset × ratio × labels state:
//  - magnification: the lens copy's scale at u 0.5 against the plan's scale AT REST (u 0.1) is >= 1.5;
//  - one copy of the changed datum at a time: the context card texts and the lens card texts are never both >= 0.15;
//  - no empty lens outline (lens drawn, copy < 0.15) for more than 200 ms.
test(`${ID}: rest magnification, one datum copy at a time, hand-over gaps <= 200 ms, no long empty lens`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const q = n => svg.querySelector(`[data-node="${n}"]`);
      const eff = e => { let o = 1; for (let z = e; z && z !== svg; z = z.parentNode) { const a = z.getAttribute && z.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
      const tag = `${pr.name} ${ratio} ${tv}`;
      x.seek(0.1 * x.durationMs);
      const restA = q('cx-plan').getScreenCTM().a;
      x.seek(0.5 * x.durationMs);
      const mag = q('lz-plan').getScreenCTM().a / restA;
      if (mag < 1.5 - 1e-3) out.push(`${tag}: magnification vs rest ${mag.toFixed(3)}`);
      const texts = pre => ['old', 'new', 'was'].map(n => q(`${pre}-${n}`)).filter(Boolean).flatMap(e => [...e.querySelectorAll('text')]);
      const step = 1000 / 60;
      let blank = 0, blankMax = 0;
      // hand-over gaps (round 2): open = first lens-legible frame − last context-legible frame; close = first
      // context-legible frame after the lens copy − last lens-legible frame (legible = effective opacity >= 0.15)
      let ctxLast = null, lzFirst = null, lzLast = null, ctxBack = null;
      for (let ms = 0; ms <= x.durationMs + 0.01; ms += step) {
        x.seek(ms);
        const u = ms / x.durationMs;
        const c = Math.max(0, ...texts('cx').map(eff)), l = Math.max(0, ...texts('lz').map(eff));
        if (u < 0.5 && c >= 0.15 && lzFirst === null) ctxLast = u;
        if (u < 0.5 && l >= 0.15 && lzFirst === null) lzFirst = u;
        if (u >= 0.5 && l >= 0.15) lzLast = u;
        if (u >= 0.5 && c >= 0.15 && lzLast !== null && ctxBack === null) ctxBack = u;
        if (Math.min(c, l) >= 0.15) out.push(`${tag} u=${(ms / x.durationMs).toFixed(3)}: both datum copies shown (${c.toFixed(2)} / ${l.toFixed(2)})`);
        const lzOp = eff(q('lz')), copy = lzOp * parseFloat(q('lz-copy').getAttribute('opacity') ?? 1);
        if (lzOp >= 0.3 && copy < 0.15) { blank += step; blankMax = Math.max(blankMax, blank); } else blank = 0;
      }
      if (blankMax > 200) out.push(`${tag}: empty lens outline for ${Math.round(blankMax)} ms`);
      if (tv === 'all' && [ctxLast, lzFirst, lzLast, ctxBack].some(v => v === null)) out.push(`${tag}: hand-over not measurable (${[ctxLast, lzFirst, lzLast, ctxBack]})`);
      if (ctxLast !== null && lzFirst !== null && (lzFirst - ctxLast) * x.durationMs > 200 + 1) out.push(`${tag}: open hand-over gap ${Math.round((lzFirst - ctxLast) * x.durationMs)} ms`);
      if (lzLast !== null && ctxBack !== null && (ctxBack - lzLast) * x.durationMs > 200 + 1) out.push(`${tag}: close hand-over gap ${Math.round((ctxBack - lzLast) * x.durationMs)} ms`);
      x.destroy(); el.remove();
    }
    return [...new Set(out)].slice(0, 30);
  }, [ID, presets]);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Dense rim check (every 1 %, every preset × ratio × labels): no lens-copy text is cut by the lens rim.
test(`${ID}: lens rim — no copy text cut, fields wholly in or out`, async ({page}) => {
  test.setTimeout(240000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const node = n => svg.querySelector(`[data-node="${n}"]`);
      const shown = e => { for (let q = e; q && q !== svg; q = q.parentNode) { const o = q.getAttribute && q.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.05) return false; } return true; };
      let texts = 0;
      for (let u = 0.26; u <= 0.75 + 1e-9; u += 0.01) {
        x.seek(u * x.durationMs);
        if (!shown(node('lz')) || !shown(node('lz-copy'))) continue;
        const W0 = node('lz-border').getBoundingClientRect();
        for (const t of node('lz-content').querySelectorAll('text')) {
          if (!shown(t) || !(t.textContent || '').trim()) continue;
          for (const ts of t.querySelectorAll('tspan').length ? t.querySelectorAll('tspan') : [t]) {
            const b = ts.getBoundingClientRect();
            if (b.width < 0.5) continue;
            const over = b.left < W0.right && b.right > W0.left && b.top < W0.bottom && b.bottom > W0.top;
            const inside = b.left >= W0.left - 1 && b.right <= W0.right + 1 && b.top >= W0.top - 1 && b.bottom <= W0.bottom + 1;
            if (over) texts++;
            if (over && !inside) out.push(`${pr.name} ${ratio} ${tv} u=${u.toFixed(2)}: "${ts.textContent.slice(0, 24)}" cut by the rim`);
          }
        }
      }
      if (tv === 'all' && !texts) out.push(`${pr.name} ${ratio}: no lens text found (vacuous)`);
      x.destroy(); el.remove();
    }
    return [...new Set(out)].slice(0, 30);
  }, [ID, presets]);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Coordinator decision 2026-09-26: visible text is never below 16 px at 1080p, at every sampled time.
test.describe(`${ID} text size over time`, () => {
  test(`${ID}: every visible text ≥ 16 px at every sampled u`, async ({page}) => {
    test.setTimeout(300000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
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
              const pxs = parseFloat(getComputedStyle(t).fontSize) * (t.getScreenCTM().a / s0) * 1080 / Math.min(w, h);
              if (pxs < 16 - 0.05) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: "${t.textContent.slice(0, 20)}" ${pxs.toFixed(1)} px`);
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

// Coordinator decision (courts-02 review 1): no shipped preset or default supplies a directed link between
// institutions. This scene has no link field; the sequence names seat indices only (the signal passes between people).
test(`${ID}: no shipped preset or default supplies a directed link between institutions`, async () => {
  const def = (await import('../../src/animations/courts/LAW-0224.js')).default;
  const bad = [];
  const walk = (o, path) => {
    if (Array.isArray(o)) o.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (k === 'kind') bad.push(`${path}.kind=${v}`); walk(v, `${path}.${k}`); }
  };
  for (const pr of [{name: 'default', params: def.defaultParams}, ...presetsFor(ID)]) {
    walk(pr.params, pr.name);
    
  }
  expect(Object.keys(def.paramsSchema.properties)).not.toContain('relationships');
  expect(bad).toEqual([]);
});
