// LAW-0492 — Obligaciones recíprocas · inspect. Contract battery + ID-specific checks.
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// clauses (the performances stand for the clauses), schedules, definitions and priorities (no priority between the
// columns is drawn). focusTarget (the inspected link), beforeValue / afterValue (the B performance it joins),
// detailGeometry and contextLabels are exposed. No stress field is capped.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens content is a real copy of the scene, laid
// out and posed identically every frame, mapped from the tag's own box), the change is local (only the tag's ◆ row turns
// and, once the new value is legible, only the inspected link's ◆ end slides to the new performance's port; the cards,
// the other links and the people do not move), and seeking back restores the old datum exactly.
// Lens checklist (docs/AUTHORING.md line 109; SESSION_HANDOFF lens decisions): one legible copy at a time (60 fps);
// the new value legible before any dependent change, the no-value window ≤ 180 ms; magnification ≥ 1.5 against the
// context at REST at sized hosts (640×360 element, 800×600, 1400×1000); the lens's smaller side ≥ 0.35 of the frame's
// short side; visible context ≥ 0.45 (PORTRAIT STACKED-LENS SPAN at 9:16: context + lens ≥ 0.8 of the caption-safe
// strip, context full width); lens-content fill ≥ 0.40 and text coverage ≥ 0.30 (labels on); labels hidden, a non-text
// change inside the lens; the source frame crosses no head and no other text; nothing cut by the rim; panel/lens and
// context/lens hand-overs ≤ 180 ms; the lens grows at its own place, never over the context; the NEW state in the
// context right after the close and the Δ right after.
// Windows (LAW-0492.js W): panel out 0.18–0.20 · open 0.20–0.28 · strike 0.36–0.42 · turn 0.47–0.489 · dependent
// change 0.50–0.56 · close 0.74–0.80 · Δ 0.799–0.812 · panel back 0.80–0.84 · key 0.81–0.85.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, noReciprocalRuleWords, conceptNeutral, TERM_BANNED, noOneWordLines, noLoneLetterSplit, noTornNumberUnit, esAportadoAgrees, docSize} from './ct03-rendered.js';

const ID = 'LAW-0492';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const RATIOS = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];

contractSuite(ID, {
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextValue === 'Performance B1 (supplied text)' && s.bAt === 1 && !s.markerVisible", label: 'context: the story end state; link 1 joins A1 and B1 as supplied; no marker'},
    {at: 0.34, fn: "s.lensOpen === 1 && s.datum === 'before' && s.zoom >= 1.6 && s.lensValue === 'Performance B1 (supplied text)' && s.contextValue === null", label: 'isolate: a real enlarged copy (≥ 1.6×); the context tag blank while the lens shows it'},
    {at: 0.44, fn: "s.strike === 1 && s.datum === 'before' && s.bAt === 1", label: 'the old value struck before anything changes'},
    {at: 0.495, fn: "s.datum === 'after' && s.lensValue === 'Performance B2 (supplied text)' && s.bAt === 1 && s.dep === 0", label: 'the new value legible first; the link has not moved yet'},
    {at: 0.53, fn: "s.bAt === 'moving'", label: 'then the link’s ◆ end slides along column B'},
    {at: 0.6, fn: "s.bAt === 2 && s.lensOpen === 1 && s.datum === 'after'", label: 'the link joins B2; the lens still open'},
    {at: 0.81, fn: "s.lensOpen === 0 && s.contextValue === 'Performance B2 (supplied text)' && s.bAt === 2", label: 'the lens has closed onto the tag, which shows the new value'},
    {at: 1, fn: 's.markerVisible && s.layoutOk && s.allReached', label: 'return: Δ marker; nothing concluded'},
    {at: 0.3, fn: "s.datum === 'before' && s.strike === 0 && s.bAt === 1", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.focusLink === 2 && s.before === 3 && s.after === 1 && s.bAt === 1 && s.contextValue === 'Task B1 (supplied text)'", label: 'alternative: link 2 from B3 to B1'},
    {at: 0.6, params: {textVisibility: 'none'}, fn: "s.lensOpen === 1 && s.datum === 'after' && s.bAt === 2", label: 'labels hidden: the same isolation and substitution'},
  ],
});

ratioChecks(ID, 'lens: zoom, never over the context, the new value still', [
  {at: times(0.2, 0.8, 0.01), fn: 's.lensClearOfHeads && s.lensClearOfContext && s.allReached', label: 'the lens never covers a head or the context'},
  {at: [0.34, 0.5, 0.7], fn: 's.zoom >= 1.5 - 1e-9 && s.lensOpen === 1', label: 'lens ≥ 1.5×'},
  {at: times(0.5, 0.74, 0.01), fn: "s.datum === 'after' && s.lensOpen === 1", label: 'the new value stays still in the open lens for ≥ 400 ms'},
  {at: [1], fn: 's.layoutOk', label: 'layout fits'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title, p.columns.a, p.columns.b, ...p.performancesA, ...p.performancesB, ...p.parties.map(q => q.name), p.contextLabels.context, p.contextLabels.marker]",
  content: "return [p.columns.a, p.columns.b, ...p.performancesA, ...p.performancesB, p.contextLabels.marker]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID, {tvs: ['all', 'key', 'none']});
noTextOverlap(ID);
noTextOverProps(ID, ['[data-node="st-A-head"]', '[data-node="st-B-head"]']);
seekHistory(ID);
fill(ID, [0.05, 0.5, 1], {short: 0.5});
headFloor(ID, {floors: Object.fromEntries(['default', 'baseline-illustrative', 'contrast-or-alternative', 'baseline-es'].flatMap(n => [[`${n}|1:1`, 50], [`${n}|16:9`, 60], [`${n}|9:16`, 60]]))});
esDefaults(ID);
noReciprocalRuleWords(ID);
conceptNeutral(ID);
docSize(ID, {cards: '^st-card-[ab]\\d-in$', times: [0.1, 1], floor: 70});
// (the inspected object — the tag — is a real object: ≥ 85 px at 1:1 outside the stress preset)
docSize(ID, {cards: '^st-tag$', times: [0.1, 1]});

test(`${ID}: no preset supplies rule, conclusion or exchange wording (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) expect(JSON.stringify(pr.params).match(TERM_BANNED), pr.name).toBeNull();
});

/** In-page helpers shared by the lens checks (as a string: evaluated in the page). */
const HELP = `
  const eff = (svg, e) => { let v = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null) v *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return v; };
  const box = (svg, n) => { const e = svg.querySelector('[data-node="' + n + '"]'); return e ? e.getBoundingClientRect() : null; };
`;

// Lens checklist, rendered (every preset × ratio × labels, 60 fps where it matters).
test(`${ID}: lens checklist — one copy, hand-overs, size, rest magnification, context, rim, coverage (rendered)`, async ({page}) => {
  test.setTimeout(900000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, {name: 'es-only', params: {locale: 'es'}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets, ratios, HELP]) => {
    eval(HELP.replace(/const /g, 'globalThis.'));
    const def = await window.__lib.load(id);
    const fails = [], rows = [];
    for (const pr of presets) for (const [ratio, w, h] of ratios) for (const tv of ['all', 'none']) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const k = 1080 / Math.min(w, h) * (w / svg.getBoundingClientRect().width);
      const tag = `${pr.name} ${ratio} ${tv}`;
      const ctxTexts = [...svg.querySelectorAll('[data-node="st-tag"] text')];
      const lzTexts = [...svg.querySelectorAll('[data-node="lzs-tag"] text')];
      const legible = ts => ts.some(t => eff(svg, t) >= 0.15);
      // 60 fps: one copy at a time; hand-overs; the panel/lens hand-over
      let gap = 0, worstGap = 0, pgap = 0, worstP = 0;
      for (let t = 0; t <= x.durationMs + 1e-6; t += 1000 / 60) {
        x.seek(t);
        const u = t / x.durationMs;
        if (tv === 'all') {
          const a = legible(ctxTexts), b = legible(lzTexts) && eff(svg, svg.querySelector('[data-node="lens-win"]')) > 0;
          if (a && b) fails.push(`${tag} t${Math.round(t)}: two legible copies of the tag`);
          if (!a && !b && u > 0.15 && u < 0.85) { gap += 1000 / 60; worstGap = Math.max(worstGap, gap); } else gap = 0;
        }
        const pv = Math.max(eff(svg, svg.querySelector('[data-node="panel-rest"]')), eff(svg, svg.querySelector('[data-node="panel-hold"]')));
        const lv = eff(svg, svg.querySelector('[data-node="lens-win"]'));
        if (pv < 0.15 && lv < 0.5 && u > 0.1 && u < 0.9) { pgap += 1000 / 60; worstP = Math.max(worstP, pgap); } else pgap = 0;
      }
      if (worstGap > 180) fails.push(`${tag}: no legible copy of the tag for ${worstGap.toFixed(0)} ms`);
      if (worstP > 180) fails.push(`${tag}: neither panel nor lens for ${worstP.toFixed(0)} ms`);
      // open lens: size, context, rim, fill, text coverage, source frame
      x.seek(0.6 * x.durationMs);
      const W0 = box(svg, 'lens-border');
      const short = Math.min(W0.width, W0.height) * k, fshort = 1080;
      if (short < 0.35 * fshort - 0.5) fails.push(`${tag}: lens smaller side ${(short / fshort).toFixed(3)} < 0.35`);
      const R = svg.getBoundingClientRect();
      if (ratio !== '9:16') {
        const cf = (W0.left - R.left) / R.width;
        if (cf < 0.45) fails.push(`${tag}: visible context ${cf.toFixed(3)} < 0.45`);
        rows.push(`${tag} context ${cf.toFixed(3)}`);
      } else {
        const sa = x.getState({bounds: false}).params.safeArea;
        const strip = R.height * (1 - sa.top - sa.bottom);
        const top = R.top + R.height * sa.top;
        const span = (W0.bottom - top) / strip;
        if (span < 0.8) fails.push(`${tag}: context + lens span ${span.toFixed(3)} < 0.8`);
        rows.push(`${tag} span ${span.toFixed(3)}`);
      }
      // nothing cut by the rim: every visible lens-copy text wholly inside the window
      for (const t of svg.querySelectorAll('[data-node="lens-content"] text')) {
        if (eff(svg, t) < 0.15) continue;
        const b = t.getBoundingClientRect();
        if (!b.width) continue;
        const inside = b.left >= W0.left - 0.5 && b.right <= W0.right + 0.5 && b.top >= W0.top - 0.5 && b.bottom <= W0.bottom + 0.5;
        const outside = b.right <= W0.left || b.left >= W0.right || b.bottom <= W0.top || b.top >= W0.bottom;
        if (!inside && !outside) fails.push(`${tag}: "${t.textContent.trim().slice(0, 20)}" cut by the rim`);
      }
      // fill and text coverage (grid over the window)
      const N = 30;
      const leaves = [...svg.querySelectorAll('[data-node="lens-content"] path, [data-node="lens-content"] rect, [data-node="lens-content"] circle, [data-node="lens-content"] text, [data-node="lens-content"] line')].filter(e => eff(svg, e) > 0.05).map(e => ({t: e.tagName, b: e.getBoundingClientRect()}));
      let fillN = 0, textN = 0;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const cx = W0.left + (i + 0.5) * W0.width / N, cy = W0.top + (j + 0.5) * W0.height / N;
        const hit = leaves.filter(q => cx >= q.b.left && cx <= q.b.right && cy >= q.b.top && cy <= q.b.bottom);
        if (hit.length) fillN++;
        if (hit.some(q => q.t === 'text')) textN++;
      }
      if (fillN / (N * N) < 0.4) fails.push(`${tag}: lens fill ${(fillN / N / N).toFixed(2)} < 0.40`);
      if (tv === 'all' && textN / (N * N) < 0.3) fails.push(`${tag}: lens text coverage ${(textN / N / N).toFixed(2)} < 0.30`);
      rows.push(`${tag} fill ${(fillN / N / N).toFixed(2)} text ${(textN / N / N).toFixed(2)}`);
      // the source frame crosses no head and no text other than the tag's own
      const S = box(svg, 'lens-src');
      for (const n of ['st-A-head', 'st-B-head']) { const hb = box(svg, n); if (hb && hb.right > S.left && hb.left < S.right && hb.bottom > S.top && hb.top < S.bottom) fails.push(`${tag}: source frame over ${n}`); }
      for (const t of svg.querySelectorAll('[data-node^="st-"] text')) {
        if (eff(svg, t) < 0.15 || t.closest('[data-node="st-tag"]')) continue;
        const b = t.getBoundingClientRect();
        const crossesV = [S.left, S.right].some(xx => xx > b.left && xx < b.right && S.bottom > b.top && S.top < b.bottom);
        const crossesH = [S.top, S.bottom].some(yy => yy > b.top && yy < b.bottom && S.right > b.left && S.left < b.right);
        if (crossesV || crossesH) fails.push(`${tag}: source frame crosses "${t.textContent.trim().slice(0, 20)}"`);
      }
      x.destroy();
      el.remove();
    }
    return {fails: [...new Set(fails)], rows};
  }, [ID, presets, RATIOS, HELP]);
  console.log(out.rows.join('\n'));
  expect(out.fails.slice(0, 30)).toEqual([]);
});

// Rest magnification at sized hosts: the lens copy of the tag is ≥ 1.5× the tag at rest, in both dimensions, at a
// 640×360 element and in 800×600 and 1400×1000 viewports (every preset × labels).
test(`${ID}: rest magnification ≥ 1.5 at every host size (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  const res = [];
  for (const [vw, vh, ew, eh] of [[1280, 800, 640, 360], [800, 600, null, null], [1400, 1000, null, null]]) {
    await page.setViewportSize({width: vw, height: vh});
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const out = await page.evaluate(async ([id, presets, ew, eh]) => {
      const def = await window.__lib.load(id);
      const r = [];
      for (const pr of presets) for (const tv of ['all', 'none']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
        const el = document.createElement('div');
        if (ew) { el.style.width = ew + 'px'; el.style.height = eh + 'px'; }
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        x.seek(0.1 * x.durationMs);
        const rest = x.element.querySelector(tv === 'all' ? '[data-node="st-tag-sheet"]' : '[data-node="st-link0-pa"]').getBoundingClientRect();
        x.seek(0.6 * x.durationMs);
        const lz = x.element.querySelector(tv === 'all' ? '[data-node="lzs-tag-sheet"]' : '[data-node="lzs-link0-pa"]').getBoundingClientRect();
        r.push([pr.name, tv, w, h, Math.min(lz.width / rest.width, lz.height / rest.height)]);
        x.destroy();
        el.remove();
      }
      return r;
    }, [ID, presets, ew, eh]);
    res.push(...out.map(q => [`${vw}x${vh}${ew ? ` el ${ew}x${eh}` : ''}`, ...q]));
  }
  console.log(res.map(q => q.join(' ')).join('\n'));
  expect(res.filter(q => q[5] < 1.5).map(q => q.join(' '))).toEqual([]);
});

// Labels hidden: a visible non-text change inside the open lens — the inspected link's ◆ end moves inside the window.
test(`${ID}: labels hidden — the link's ◆ end moves inside the lens (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: 'none'}});
      await x.ready;
      const s0 = x.getState({bounds: false}).semantic;
      const j = s0.focusLink - 1;
      const at = u => { x.seek(u * x.durationMs); const e = x.element.querySelector(`[data-node="lzs-link${j}-pb"]`).getBoundingClientRect(); return {x: e.left + e.width / 2, y: e.top + e.height / 2}; };
      const a = at(0.49), b = at(0.6);
      const W = x.element.querySelector('[data-node="lens-border"]').getBoundingClientRect();
      const inW = q => q.x > W.left && q.x < W.right && q.y > W.top && q.y < W.bottom;
      if (Math.hypot(a.x - b.x, a.y - b.y) < 10) fails.push(`${pr.name} ${ratio}: the ◆ end does not move visibly in the lens`);
      if (!inW(a) || !inW(b)) fails.push(`${pr.name} ${ratio}: the ◆ end leaves the lens`);
      x.destroy();
      el.remove();
    }
    return fails;
  }, [ID, presets]);
  expect(out).toEqual([]);
});

// Labels key / none (review ct03, cf-08 ruling; coordinator ruling 2026-10-05 on the cf precedent LAW-0472/0476/0480):
// with the panel gone the context is laid out large — the scene (its rendered box) takes ≥ 0.55 of the frame width at
// rest (u 0.05) and at the hold (u 1), at 16:9 and 1:1. At 1:1 it eases into its part of the frame only while the lens
// is open: at 60 fps the context is never below its rest size for more than 150 ms without the lens on screen.
test(`${ID}: labels key / none — the context takes ≥ 0.55 of the frame at rest and at the hold (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [], rows = [];
    for (const pr of presets) for (const [ratio, w, h, floor] of [['16:9', 1920, 1080, 0.55], ['1:1', 1080, 1080, 0.55]]) for (const tv of ['key', 'none']) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      for (const u of [0.05, 1]) {
        x.seek(u * x.durationMs);
        const R = x.element.getBoundingClientRect(), b = x.element.querySelector('[data-node="st-scene"]').getBoundingClientRect();
        const fw = b.width / R.width;
        rows.push(`${pr.name} ${ratio} ${tv} u${u} ${fw.toFixed(3)}`);
        if (fw < floor) fails.push(`${pr.name} ${ratio} ${tv} u${u}: scene ${fw.toFixed(3)} < ${floor}`);
      }
      x.seek(0);
      const rest = x.getState({bounds: false}).semantic.contextScale;
      let gap = 0, worst = 0;
      for (let t = 0; t <= x.durationMs + 1e-6; t += 1000 / 60) {
        x.seek(t);
        const s = x.getState({bounds: false}).semantic;
        const lensOn = parseFloat(x.element.querySelector('[data-node="lens-win"]').getAttribute('opacity') ?? '0') > 0;
        if (s.contextScale < rest - 1e-3 && !lensOn) { gap += 1000 / 60; worst = Math.max(worst, gap); } else gap = 0;
      }
      if (worst > 150) fails.push(`${pr.name} ${ratio} ${tv}: context below its rest size without the lens for ${worst.toFixed(0)} ms`);
      x.destroy();
      el.remove();
    }
    return {fails, rows};
  }, [ID, presets]);
  console.log(out.rows.join('\n'));
  expect(out.fails).toEqual([]);
});

// One copy at a time for the non-text change too (review ct03: with labels hidden the ◆ end slid in the context, inside
// the source frame, while the lens showed the same slide). 60 fps, every preset × ratio × labels all / key / none:
// whenever the lens copy of the inspected link's ◆ end is visible inside the open window, the context's ◆ end of that
// link is not visible inside the source frame. And the rim cuts no card: every visible card of the lens copy is wholly
// inside the window.
test(`${ID}: one copy of the moving link end; the rim cuts no card (60 fps, rendered)`, async ({page}) => {
  test.setTimeout(900000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets, ratios, HELP]) => {
    eval(HELP.replace(/const /g, 'globalThis.'));
    const def = await window.__lib.load(id);
    const fails = [];
    let both = 0, checked = 0;
    for (const pr of presets) for (const [ratio, w, h] of ratios) for (const tv of ['all', 'key', 'none']) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const j = x.getState({bounds: false}).semantic.focusLink - 1;
      const q = n => svg.querySelector(`[data-node="${n}"]`);
      const inside = (b, W) => b.left >= W.left - 0.5 && b.right <= W.right + 0.5 && b.top >= W.top - 0.5 && b.bottom <= W.bottom + 0.5;
      const meets = (b, W) => b.right > W.left && b.left < W.right && b.bottom > W.top && b.top < W.bottom;
      for (let t = 0; t <= x.durationMs + 1e-6; t += 1000 / 60) {
        x.seek(t);
        const win = q('lens-win');
        if (eff(svg, win) < 0.5) continue;
        const W = q('lens-border').getBoundingClientRect(), S = q('lens-src').getBoundingClientRect();
        const lz = q(`lzs-link${j}-pb`), cx = q(`st-link${j}-pb`);
        const lzOn = eff(svg, lz) >= 0.15 && meets(lz.getBoundingClientRect(), W);
        const cxOn = eff(svg, cx) >= 0.15 && meets(cx.getBoundingClientRect(), S);
        checked++;
        if (lzOn && cxOn) { both++; fails.push(`${pr.name} ${ratio} ${tv} t${Math.round(t)}: the ◆ end legible in the lens and in the context`); }
        for (const c of svg.querySelectorAll('[data-node^="lzs-card-"]')) {
          if (!/^lzs-card-[ab]\d$/.test(c.getAttribute('data-node')) || eff(svg, c) < 0.05) continue;
          const b = c.getBoundingClientRect();
          if (meets(b, W) && !inside(b, W)) fails.push(`${pr.name} ${ratio} ${tv}: lens card ${c.getAttribute('data-node')} cut by the rim`);
        }
      }
      x.destroy();
      el.remove();
    }
    return {fails: [...new Set(fails.map(f => f.replace(/ t\d+:/, ':')))], both, checked};
  }, [ID, presets, RATIOS, HELP]);
  expect(out.checked).toBeGreaterThan(1000);
  expect(out.fails.slice(0, 30)).toEqual([]);
});

// The Δ marker is clear of every text and in the frame at the hold (labels all / key, every preset × ratio).
test(`${ID}: the Δ marker is clear of every text (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) for (const tv of ['all', 'key']) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      x.seek(x.durationMs);
      const svg = x.element;
      const eff = e => { let v = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null) v *= parseFloat(a); } return v; };
      const d = svg.querySelector('[data-node="st-delta"]').getBoundingClientRect();
      const R = svg.getBoundingClientRect();
      if (d.left < R.left || d.right > R.right || d.top < R.top || d.bottom > R.bottom) fails.push(`${pr.name} ${ratio} ${tv}: Δ outside the frame`);
      for (const t of svg.querySelectorAll('text')) {
        if (eff(t) < 0.15 || t.closest('[data-layer="content-notice"]')) continue;
        const b = t.getBoundingClientRect();
        if (b.right > d.left && b.left < d.right && b.bottom > d.top && b.top < d.bottom) fails.push(`${pr.name} ${ratio} ${tv}: Δ over "${t.textContent.trim().slice(0, 20)}"`);
      }
      x.destroy();
      el.remove();
    }
    return fails;
  }, [ID, presets]);
  expect(out).toEqual([]);
});

noOneWordLines(ID);
noLoneLetterSplit(ID);
noTornNumberUnit(ID);
esAportadoAgrees(ID);
