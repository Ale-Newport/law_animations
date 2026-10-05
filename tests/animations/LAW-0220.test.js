// LAW-0220 — Acceso a sala · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens holds a second copy of the plan art, the
// route lines and the tag drawn at the SAME coordinates, cropped to the entrance hall where the routes part and the
// tag), the change is localised (only the inspected participant's route line re-routes; every seat and person stays)
// and seeking back restores exactly the previous datum.
// Windows (u): route lines draw 0.03–0.15 · frame 0.20–0.24 · plan shrinks 0.21–0.27 · lens opens 0.245–0.315 ·
// strike 0.46–0.50 · old value docks 0.51–0.55 · new value 0.555–0.585 · old line retracts 0.59–0.63 · new line draws
// 0.63–0.68 · lens closes 0.715–0.76 · plan grows back 0.74–0.80 · texts return 0.80–0.83 · marker 0.83–0.87.
// Coordinator decision (standing stress rule, 2026-09-26, AUTHORING item 20): the long-labels-stress texts are capped
// (strictly longer than baseline, counts equal to baseline) — measurements in the presets file.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0220';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['focusSeat'],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.markerShown === 0 && s.contextScale === 1 && s.focusRoute === 'public'", label: 'context: the supplied routes, the old datum, no lens, no marker'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.datum === 'before' && s.zoom >= 1.5 && s.stackInCrop && s.lensClearOfPeople && s.lensClearOfSource && s.lensClearOfScene", label: 'isolate: a real enlargement (>= 1.5x) of the hall and the whole tag, clear of every person, the plan and its source'},
    {at: 0.49, fn: "s.datum === 'changing' && s.strike > 0 && s.focusRoute === 'public'", label: 'substitute: the old value is struck before anything changes'},
    {at: 0.585, fn: "s.oldDocked === 1 && s.newShown === 1 && s.focusRoute === 'public'", label: 'the old value docks as “was”, the new value shows; the line has not changed yet (cause first)'},
    {at: 0.65, fn: "s.focusRoute === 'changing' && s.lensOpen === 1", label: 'the dependent connection follows inside the lens: the route line re-routes'},
    {at: 0.7, fn: "s.datum === 'after' && s.focusRoute === 'restricted' && s.lensOpen === 1", label: 'the new value and the new route line'},
    {at: 0.8, fn: "s.lensOpen === 0 && s.datum === 'after'", label: 'return: the lens has closed onto the updated context'},
    {at: 1, fn: "s.markerShown === 1 && s.datum === 'after' && s.oldDocked === 1 && s.contextScale === 1 && s.allReached && s.problems.length === 0", label: 'hold: full-size plan, struck old value docked, marker shown'},
    {at: 0.3, fn: "s.datum === 'before' && s.strike === 0 && s.oldDocked === 0 && s.focusRoute === 'public'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, fn: "JSON.stringify(s.seatsFixed) === JSON.stringify(s.seatsFixed) && s.moves", label: 'every seat stays; only the inspected route line changes'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.beforeAccess === 'restricted' && s.afterAccess === 'public' && s.focusRoute === 'public' && s.markerShown === 1", label: 'alternative: a restricted route as configured substituted by the public one'},
    {at: 1, params: {focusTarget: 'wording', afterValue: 'Route: public access'}, fn: "!s.moves && s.datum === 'after' && s.focusRoute === 'public'", label: 'wording substitution: only the tag wording changes; no line moves'},
    {at: 1, params: {afterAccess: 'public'}, fn: "!s.moves && s.focusRoute === 'public'", label: 'an after-route equal to the supplied route moves nothing (nothing inferred)'},
    {at: 0.66, params: {textVisibility: 'none'}, fn: "s.lensOpen === 1 && s.moves", label: 'labels hidden: the same localised change is visible'},
    {at: 0.5, fn: 's.lensShort >= 0.35', label: 'the lens is large (its short side >= 35 % of the frame short side)'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const seats = p.routes.map(r => p.seats[r.seat] && p.seats[r.seat].label).filter(Boolean); return [p.courts.building, p.courts.room, ...seats, p.labels.publicAccess, p.labels.restrictedAccess, p.labels.key, p.afterValue, p.beforeValue, p.contextLabels.context, p.contextLabels.marker];",
  content: "const seats = p.routes.map(r => p.seats[r.seat] && p.seats[r.seat].label).filter(Boolean); return [...seats, p.afterValue, p.beforeValue, p.labels.publicAccess, p.labels.restrictedAccess];",
  captions: 'return [p.contextLabels.context, p.contextLabels.marker];',
});

const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const PEOPLE = "const people = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node')));";
const peopleMin = min => `(() => { ${K} ${PEOPLE}
  return people.length > 0 && people.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); const b = e.getBoundingClientRect(); return hd.width / K >= ${min * 26 / 60} && Math.max(b.width, b.height) / K >= ${min}; });
})()`;
const NO_COVER = `(() => { ${BOX} ${PEOPLE}
  const heads = people.map(e => bx(svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]')));
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^(lab\\d+-body|cx-tag-body|cx-marker|lz-border|bld-name|room-name|legend-\\w+|key|ctx-caption|marker-note)$/.test(e.getAttribute('data-node')) && visible(e)).map(bx);
  return heads.length > 0 && cards.every(c => heads.every(hd => !hit(c, hd, 1)));
})()`;
// the substituted value (and, once docked, the struck old value) stay visible at >= 16 px through return and hold
const VALUE_TRACE = `(() => { ${K}
  const s0 = svg.getScreenCTM().a;
  const vis = e => { for (let q = e; q && q !== svg; q = q.parentNode) { const o = q.getAttribute && q.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.5) return false; } return true; };
  const ok = n => { const g = svg.querySelector('[data-node="' + n + '"]'); if (!g || !vis(g)) return false; const t = g.querySelector('text'); const px = parseFloat(getComputedStyle(t).fontSize) * (t.getScreenCTM().a / s0) * 1080 / Math.min(vb.width, vb.height); return px >= 16 - 0.05; };
  const lensOpen = (() => { const l = svg.querySelector('[data-node="lz"]'); return l && parseFloat(l.getAttribute('opacity') || '0') > 0.5; })();
  return lensOpen ? (ok('lz-new') && ok('lz-was')) : (ok('cx-new') && ok('cx-was'));
})()`;
const GUIDES = `(() => { ${BOX} ${PEOPLE}
  const heads = people.map(e => bx(svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]')));
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]') && !t.closest('[data-node="lz"]')).map(bx);
  const lines = [...svg.querySelectorAll('[data-node^="guide"]')].filter(e => visible(e));
  for (const ln of lines) {
    const m = ln.getScreenCTM();
    const A = new DOMPoint(+ln.getAttribute('x1'), +ln.getAttribute('y1')).matrixTransform(m), B = new DOMPoint(+ln.getAttribute('x2'), +ln.getAttribute('y2')).matrixTransform(m);
    for (let j = 2; j <= 38; j++) { const q = {x: A.x + (B.x - A.x) * j / 40, y: A.y + (B.y - A.y) * j / 40}; if ([...texts, ...heads].some(o => q.x > o.l - 2 && q.x < o.r + 2 && q.y > o.t - 2 && q.y < o.b + 2)) return false; }
  }
  return true;
})()`;
// the lens copy mirrors the scene: the tag states and the inspected route line carry the same attributes
const MIRROR = `(() => {
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  const pairs = [['cx-old', 'lz-old', ['opacity', 'transform']], ['cx-new', 'lz-new', ['opacity']], ['cx-was', 'lz-was', ['opacity']], ['cx-st0', 'lz-st0', ['x1', 'x2']], ['trail-after-line', 'lz-trail-after-line', ['stroke-dashoffset', 'stroke-dasharray']]];
  for (const [a, b, ats] of pairs) {
    const A = q(a), B = q(b);
    if (!A && !B) continue;
    if (!A || !B) return false;
    for (const at of ats) if ((A.getAttribute(at) || '') !== (B.getAttribute(at) || '')) return false;
  }
  return true;
})()`;
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
// lens checklist: the drawn context (the plan) keeps >= 45 % of the safe width at every u; while the lens is open,
// context + lens span >= 80 % of the safe width or height
const SAFE_W = "const vb = svg.viewBox.baseVal; const m = svg.getScreenCTM().inverse(); const X = v => new DOMPoint(v, 0).matrixTransform(m).x; const Y = v => new DOMPoint(0, v).matrixTransform(m).y; const sw = vb.width * 0.88, shh = vb.height * 0.74;";
const CTX_SPAN = "const pr = svg.querySelector('[data-node=\"rm-plan-art\"]').getBoundingClientRect(); let cl = X(pr.left), cr = X(pr.right), ct = Y(pr.top), cb = Y(pr.bottom);";
const CONTEXT_WIDE = `(() => { ${SAFE_W} ${CTX_SPAN} return (cr - cl) >= 0.45 * sw; })()`;
const CONTEXT_LENS_FILL = `(() => { ${SAFE_W} ${CTX_SPAN} const pn = svg.querySelector('[data-node="panel"]').getBoundingClientRect(); if (pn.height > 1 && Y(pn.bottom) <= ct + 2) { ct = Y(pn.top); } const b = svg.querySelector('[data-node="lz-border"]').getBoundingClientRect(); return (Math.max(cr, X(b.right)) - Math.min(cl, X(b.left))) >= 0.8 * sw || (Math.max(cb, Y(b.bottom)) - Math.min(ct, Y(b.top))) >= 0.8 * shh; })()`;
const EQUAL_ROUTES = `(() => {
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  const a = q('rm-badge-public').getBoundingClientRect(), b = q('rm-badge-restricted').getBoundingClientRect();
  if (Math.abs(a.width - b.width) > 0.5 || Math.abs(a.height - b.height) > 0.5) return false;
  for (const n of ['rm-door-public', 'rm-door-restricted', 'rm-badge-public', 'rm-badge-restricted']) if ([...q(n).querySelectorAll('*')].some(e => e.getAttribute('stroke-dasharray'))) return false;
  return true;
})()`;
const NO_ARROWS = "!svg.querySelector('[marker-end], marker')";

// the lens shows the decisive detail: both badged hall openings (where the routes part), the origin pad and the tag,
// each wholly inside the lens window
const LENS_DETAIL = `(() => {
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  const W0 = q('lz-border').getBoundingClientRect();
  const inside = e => { const b = e.getBoundingClientRect(); return b.width > 1 && b.left >= W0.left - 1 && b.right <= W0.right + 1 && b.top >= W0.top - 1 && b.bottom <= W0.bottom + 1; };
  const tag = q('lz-tag-body');
  return inside(q('lz-hall-badge-public')) && inside(q('lz-hall-badge-restricted')) && (!tag || inside(tag));
})()`;
// the source frame outlines the copied detail with the tag visible inside it (not hidden while the lens is open)
const SOURCE_SHOWS = `(() => {
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  const F0 = q('src-frame').getBoundingClientRect();
  const inside = e => { const b = e.getBoundingClientRect(); return b.left >= F0.left - 2 && b.right <= F0.right + 2 && b.top >= F0.top - 2 && b.bottom <= F0.bottom + 2; };
  const tag = q('cx-tag-body');
  return inside(q('rm-hall-badge-public')) && inside(q('rm-hall-badge-restricted')) && (!tag || (visible(tag) && inside(tag)));
})()`;


// review 1 (LAW-0220): the two hall badges never overlap, in the plan or in the lens copy
const BADGES_APART = `(() => { ${BOX}
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  for (const pre of ['rm', 'lz']) { const a = q(pre + '-hall-badge-public'), b = q(pre + '-hall-badge-restricted'); if (!a || !b) return false; const A = bx(a), B = bx(b); if (A.r - A.l < 1) continue; if (hit(A, B)) return false; }
  return true;
})()`;
// review 1: the lens window's short side is >= 35 % of the FRAME's short side (rendered, in viewBox units)
const LENS_SIZE = `(() => { const vb = svg.viewBox.baseVal; const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-node="lz-border"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); return Math.min(p2.x - p1.x, p2.y - p1.y) >= 0.35 * Math.min(vb.width, vb.height); })()`;
// review 1: while any part of the lens shows, no panel text under it is still visible (the panel fades out fully
// before the lens appears and returns only after the lens has gone)
const EFF = "const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };";
const PANEL_CLEAR = `(() => { ${BOX} ${EFF}
  const lz = svg.querySelector('[data-node="lz"]'); if (eff(lz) < 0.002) return true;
  const W0 = bx(svg.querySelector('[data-node="lz-border"]'));
  return [...svg.querySelectorAll('[data-node="panel"] text')].every(t => eff(t) < 0.002 || !(t.textContent || '').trim() || !hit(bx(t), W0));
})()`;
// AUTHORING: baseline presets (baseline-es included) render every visible text >= 19.5 px (1080p) in every ratio
const TEXT_195 = `(() => { ${EFF} const s0 = svg.getScreenCTM().a; const vb = svg.viewBox.baseVal;
  const ts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]') && eff(t) >= 0.05 && (t.textContent || '').trim() && t.getBoundingClientRect().width >= 0.5);
  return ts.length > 0 && ts.every(t => parseFloat(getComputedStyle(t).fontSize) * (t.getScreenCTM().a / s0) * 1080 / Math.min(vb.width, vb.height) >= 19.5 - 0.05);
})()`;


// review 1: at least one guide ties the frame to the lens, and no guide cuts across the (shrunk) plan outside the
// source frame (a strip of 6 % of the plan height along its edge is tolerated)
const GUIDE_OFF_PLAN = `(() => {
  const P0 = svg.querySelector('[data-node="rm-plan-art"]').getBoundingClientRect(), S0 = svg.querySelector('[data-node="src-frame"]').getBoundingClientRect();
  const m0 = Math.max(6 * svg.getScreenCTM().a, 0.06 * P0.height);
  const lines = [...svg.querySelectorAll('[data-node^="guide"]')].filter(e => visible(e) && parseFloat(e.getAttribute('opacity') || '1') > 0.5);
  if (!lines.length) return false;
  for (const ln of lines) {
    const m = ln.getScreenCTM();
    const A = new DOMPoint(+ln.getAttribute('x1'), +ln.getAttribute('y1')).matrixTransform(m), B = new DOMPoint(+ln.getAttribute('x2'), +ln.getAttribute('y2')).matrixTransform(m);
    for (let j = 1; j < 40; j++) {
      const q = {x: A.x + (B.x - A.x) * j / 40, y: A.y + (B.y - A.y) * j / 40};
      const inPlan = q.x > P0.left + m0 && q.x < P0.right - m0 && q.y > P0.top + m0 && q.y < P0.bottom - m0;
      const inSrc = q.x > S0.left - 3 && q.x < S0.right + 3 && q.y > S0.top - 3 && q.y < S0.bottom + 3;
      if (inPlan && !inSrc) return false;
    }
  }
  return true;
})()`;

ratioChecks(ID, 'lens checklist, people size, value traceable, guides, mirror, fill', [
  {at: times(0, 1, 0.02), dom: CONTEXT_WIDE, label: 'rendered: the drawn plan keeps >= 45 % of the safe width at every u'},
  {at: times(0.34, 0.7, 0.04), dom: CONTEXT_LENS_FILL, label: 'rendered: while the lens is open, plan (with the panel band above it in portrait) + lens span >= 80 % of the safe box on the lens axis'},
  {at: [0.1, 1], fn: 's.contextScale === 1 && s.textOnPlan === 1 && s.lensOpen === 0', label: 'build and hold: the plan at full size, every text on it shown, no lens'},
  {at: [0.4, 0.5, 0.6, 0.7], fn: 's.zoom >= 1.5 && s.lensOpen === 1 && s.stackInCrop', label: 'the lens enlarges >= 1.5x and holds the whole tag and its docked value'},
  {at: times(0.2, 0.8, 0.02), fn: 's.lensClearOfPeople && s.lensClearOfSource && s.lensClearOfScene', label: 'the lens never covers a person, the plan or its own source'},
  {at: times(0.585, 0.71, 0.01), tv: ['all'], fn: "s.newShown === 1 && s.lensOpen === 1", label: 'the new value is readable and still in the lens for >= 400 ms'},
  {at: times(0.2, 0.9, 0.02), dom: peopleMin(45), label: 'rendered: while the lens phase runs every person stays >= 45 px across (1080p)'},
  {at: [0, 0.1, 0.19, 0.9, 1], dom: peopleMin(60), label: 'rendered: at rest, build and hold people >= 60 px across, heads >= 26 px (1080p)'},
  {at: times(0.77, 1, 0.01), tv: ['all'], dom: VALUE_TRACE, label: 'rendered: through the return and hold the new value and the struck old value stay visible at >= 16 px'},
  {at: times(0, 1, 0.03), dom: NO_COVER, label: 'rendered: no chip, marker, panel item or lens window covers a head'},
  {at: [0.4, 0.5, 0.6, 0.7], dom: GUIDE_OFF_PLAN, label: 'rendered: at least one guide shows, and no guide cuts across the plan outside the source frame'},
  {at: [0.3, 0.5, 0.7], dom: GUIDES, label: 'rendered: guides cross no text or head'},
  {at: times(0.3, 0.74, 0.02), tv: ['all'], dom: MIRROR, label: 'rendered: the lens copy carries exactly the scene’s tag and route-line attributes'},
  {at: [0.4, 0.5, 0.6, 0.7], dom: LENS_DETAIL, label: 'rendered: the lens holds both badged hall openings and the whole tag'},
  {at: [0.3, 0.5, 0.7], dom: SOURCE_SHOWS, label: 'rendered: the source frame outlines both badged openings and the visible tag'},
  {at: [1], dom: FILL, label: 'rendered: plan and panel fill the caption-safe box'},
  {at: [0.1, 1], dom: EQUAL_ROUTES, label: 'rendered: both routes have equal weight (badges, doors; nothing dashed)'},
  {at: [0.1, 0.6, 1], dom: NO_ARROWS, label: 'rendered: no arrowheads'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
  {at: [0.1, 1], tv: ['all'], presets: ['baseline-illustrative', 'baseline-es'], dom: TEXT_195, label: 'rendered: baseline and baseline-es: every visible text >= 19.5 px in every ratio'},
  {at: [0.1, 0.4, 0.6, 1], dom: BADGES_APART, label: 'rendered: the two hall badges never overlap (plan and lens)'},
  {at: [0.4, 0.5, 0.6, 0.7], dom: LENS_SIZE, label: 'rendered: the lens short side >= 35 % of the frame short side'},
  {at: [...times(0.19, 0.33, 0.005), ...times(0.69, 0.8, 0.005)], dom: PANEL_CLEAR, label: 'rendered: no panel text shows under any part of the lens while it opens, holds or closes'},
]);

// Dense rim check (every 1 %, every preset × ratio × labels): no lens-copy text is cut by the lens rim, each field is
// wholly in the lens or wholly out.
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
      for (let u = 0.22; u <= 0.8 + 1e-9; u += 0.01) {
        x.seek(u * x.durationMs);
        if (!shown(node('lz'))) continue;
        const W0 = node('lz-border').getBoundingClientRect();
        for (const t of node('lz-content').querySelectorAll('text')) {
          if (!shown(t) || !(t.textContent || '').trim()) continue;
          texts++;
          for (const ts of t.querySelectorAll('tspan')) {
            const b = ts.getBoundingClientRect();
            if (b.width < 0.5) continue;
            const over = b.left < W0.right && b.right > W0.left && b.top < W0.bottom && b.bottom > W0.top;
            const inside = b.left >= W0.left - 1 && b.right <= W0.right + 1 && b.top >= W0.top - 1 && b.bottom <= W0.bottom + 1;
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
              const fs = parseFloat(getComputedStyle(t).fontSize);
              const pxs = fs * (t.getScreenCTM().a / s0) * 1080 / Math.min(w, h);
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
// institutions. This scene has no link field; the route data name an access route per participant only.
test(`${ID}: no shipped preset or default supplies a directed link between institutions`, async () => {
  const def = (await import('../../src/animations/courts/LAW-0220.js')).default;
  const bad = [];
  for (const pr of [{name: 'default', params: def.defaultParams}, ...presetsFor(ID)]) {
    (pr.params.routes ?? def.defaultParams.routes).forEach((r, i) => { if (Object.keys(r).some(k => !['seat', 'access'].includes(k))) bad.push(`${pr.name} routes[${i}] has extra keys`); });
    JSON.stringify(pr.params, (k, v) => { if (k === 'kind' && v !== 'relation') bad.push(`${pr.name} kind=${v}`); return v; });
  }
  expect(Object.keys(def.paramsSchema.properties)).not.toContain('relationships');
  expect(bad).toEqual([]);
});
