// LAW-0496 — Condición de activación · inspect. Contract battery + ID-specific checks.
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// clauses (the event card and the obligation cards stand for the clauses), schedules, definitions and priorities (no
// priority or order between obligations is drawn). focusTarget (one value: the event card's state row), beforeValue /
// afterValue (the supplied state of the event), detailGeometry and contextLabels are exposed. No stress field is capped.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens content is a real copy of the board, laid out
// and posed identically every frame, mapped from the event card's own box), the change is local (only the card's state
// row turns and, once the new value is legible, only the bracket slides — open or shut, as supplied; the cards and the
// people do not move), and seeking back restores the old datum exactly.
// Lens checklist (docs/AUTHORING.md line 109; SESSION_HANDOFF lens decisions): one legible copy at a time, the state
// glyph included (60 fps); the new value legible before any dependent change, the no-value window ≤ 180 ms;
// magnification ≥ 1.5 against the context at REST at sized hosts (640×360 element, 800×600, 1400×1000); the lens's
// smaller side ≥ 0.35 of the frame's short side; visible context ≥ 0.45 (PORTRAIT STACKED-LENS SPAN at 9:16: context +
// lens ≥ 0.8 of the caption-safe strip, context full width); lens-content fill ≥ 0.40 and text coverage ≥ 0.30 (labels
// on); labels hidden, a non-text change inside the lens (the glyph turns ● → ◆); the source frame crosses no head and no
// other text; nothing cut by the rim; panel/lens and context/lens hand-overs ≤ 180 ms; the lens grows at its own place,
// never over the context; the NEW state in the context right after the close and the Δ right after; labels key / none
// (cf-08 / cf-10 rulings): the scene ≥ 0.55 of the frame at rest and at the hold, shrinking only while the lens is open.
// Windows (LAW-0496.js W): panel out 0.18–0.20 · open 0.20–0.28 · strike 0.36–0.42 · turn 0.47–0.489 · dependent
// change (the bracket) 0.50–0.56 · close 0.74–0.80 · Δ 0.799–0.812 · panel back 0.80–0.84 · key 0.81–0.85.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, noConditionRuleWords, conceptNeutral, TERM_BANNED, CONFIG_WORDS, noOneWordLines, noLoneLetterSplit, noTornNumberUnit, esAportadoAgrees, docSize} from './ct04-rendered.js';

const ID = 'LAW-0496';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const RATIOS = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];

contractSuite(ID, {
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextState === 'produced' && s.bracket === 'closed' && !s.markerVisible", label: 'context: the story end state — produced, the bracket shut on the tranche; no marker'},
    {at: 0.34, fn: "s.lensOpen === 1 && s.datum === 'before' && s.zoom >= 1.6 && s.lensState === 'produced' && s.contextState === null", label: 'isolate: a real enlarged copy (≥ 1.6×); the context card blank while the lens shows it'},
    {at: 0.44, fn: "s.strike === 1 && s.datum === 'before' && s.bracket === 'closed'", label: 'the old value struck before anything changes'},
    {at: 0.495, fn: "s.datum === 'after' && s.lensState === 'pending' && s.dep === 0 && s.bracket === 'closed'", label: 'the new value legible first; the bracket has not moved yet'},
    {at: 0.53, fn: "s.bracket === 'moving'", label: 'then the bracket slides open, as supplied'},
    {at: 0.6, fn: "s.bracket === 'open' && s.lensOpen === 1 && s.datum === 'after'", label: 'the bracket open; the lens still open'},
    {at: 0.81, fn: "s.lensOpen === 0 && s.contextState === 'pending' && s.bracket === 'open'", label: 'the lens has closed onto the card, which shows the new state'},
    {at: 1, fn: 's.markerVisible && s.layoutOk && s.allReached', label: 'return: Δ marker; nothing concluded'},
    {at: 0.3, fn: "s.datum === 'before' && s.strike === 0 && s.bracket === 'closed'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.before === 'pending' && s.after === 'produced' && s.bracket === 'closed' && s.contextState === 'produced'", label: 'alternative: pending → produced; the bracket then slides shut'},
    {at: 0.6, params: {textVisibility: 'none'}, fn: "s.lensOpen === 1 && s.datum === 'after' && s.bracket === 'open'", label: 'labels hidden: the same isolation and substitution'},
  ],
});

ratioChecks(ID, 'lens: zoom, never over the context, the new value still', [
  {at: times(0.2, 0.8, 0.01), fn: 's.lensClearOfHeads && s.lensClearOfContext && s.allReached', label: 'the lens never covers a head or the context'},
  {at: [0.34, 0.5, 0.7], fn: 's.zoom >= 1.5 - 1e-9 && s.lensOpen === 1', label: 'lens ≥ 1.5×'},
  {at: times(0.5, 0.74, 0.01), fn: "s.datum === 'after' && s.lensOpen === 1", label: 'the new value stays still in the open lens for ≥ 400 ms'},
  {at: [1], fn: 's.layoutOk', label: 'layout fits'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title, p.event.label, p.stateLabels[p.afterValue], ...p.obligations, ...p.parties.map(q => q.name), p.contextLabels.context, p.contextLabels.marker]",
  content: "return [p.event.label, p.stateLabels[p.afterValue], ...p.obligations, p.contextLabels.marker]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID, {tvs: ['all', 'key', 'none']});
noTextOverlap(ID);
noTextOverProps(ID, ['[data-node="st-A-head"]', '[data-node="st-B-head"]', '[data-node="st-br"]']);
seekHistory(ID);
fill(ID, [0.05, 0.5, 1], {short: 0.5});
headFloor(ID, {floors: Object.fromEntries(['default', 'baseline-illustrative', 'contrast-or-alternative', 'baseline-es'].flatMap(n => [[`${n}|1:1`, 50], [`${n}|16:9`, 60], [`${n}|9:16`, 60]]))});
esDefaults(ID);
noConditionRuleWords(ID);
conceptNeutral(ID);
docSize(ID, {cards: '^st-obl\\d-in$', times: [0.1, 1], floor: 70});
// (the inspected object — the event card — is a real object: ≥ 85 px at 1:1 outside the stress preset)
docSize(ID, {cards: '^st-ev-in$', times: [0.1, 1]});

test(`${ID}: no preset supplies rule, conclusion or condition wording (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) {
    expect(JSON.stringify(pr.params).match(TERM_BANNED), pr.name).toBeNull();
    expect(JSON.stringify(pr.params).match(CONFIG_WORDS), pr.name).toBeNull();
  }
});

/** In-page helpers shared by the lens checks (as a string: evaluated in the page). */
const HELP = `
  const eff = (svg, e) => { let v = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null) v *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return v; };
  const box = (svg, n) => { const e = svg.querySelector('[data-node="' + n + '"]'); return e ? e.getBoundingClientRect() : null; };
`;

// Lens checklist, rendered (every preset × ratio × labels, 60 fps where it matters).
test(`${ID}: lens checklist — one copy (glyph included), hand-overs, size, context, rim, coverage, source frame (rendered)`, async ({page}) => {
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
      // (a copy's legible marks: its texts and its state glyphs)
      const marks = P => [...svg.querySelectorAll(`[data-node="${P}ev-in"] text`), ...svg.querySelectorAll(`[data-node^="${P}ev-in-st-"] circle, [data-node^="${P}ev-in-st-"] path`)];
      const ctxM = marks('st-'), lzM = marks('lzs-');
      const legible = ms => ms.some(t => eff(svg, t) >= 0.15);
      let gap = 0, worstGap = 0, pgap = 0, worstP = 0;
      for (let t = 0; t <= x.durationMs + 1e-6; t += 1000 / 60) {
        x.seek(t);
        const u = t / x.durationMs;
        const a = legible(ctxM), b = legible(lzM) && eff(svg, svg.querySelector('[data-node="lens-win"]')) > 0;
        if (a && b) fails.push(`${tag} t${Math.round(t)}: two legible copies of the event card`);
        if (!a && !b && u > 0.15 && u < 0.85) { gap += 1000 / 60; worstGap = Math.max(worstGap, gap); } else gap = 0;
        const pv = Math.max(eff(svg, svg.querySelector('[data-node="panel-rest"]')), eff(svg, svg.querySelector('[data-node="panel-hold"]')));
        const lv = eff(svg, svg.querySelector('[data-node="lens-win"]'));
        if (tv === 'all' && pv < 0.15 && lv < 0.5 && u > 0.1 && u < 0.9) { pgap += 1000 / 60; worstP = Math.max(worstP, pgap); } else pgap = 0;
      }
      if (worstGap > 180) fails.push(`${tag}: no legible copy of the card for ${worstGap.toFixed(0)} ms`);
      if (worstP > 180) fails.push(`${tag}: neither panel nor lens for ${worstP.toFixed(0)} ms`);
      x.seek(0.6 * x.durationMs);
      const W0 = box(svg, 'lens-border');
      const short = Math.min(W0.width, W0.height) * k;
      if (short < 0.35 * 1080 - 0.5) fails.push(`${tag}: lens smaller side ${(short / 1080).toFixed(3)} < 0.35`);
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
      for (const t of svg.querySelectorAll('[data-node="lens-content"] text')) {
        if (eff(svg, t) < 0.15) continue;
        const b = t.getBoundingClientRect();
        if (!b.width) continue;
        const inside = b.left >= W0.left - 0.5 && b.right <= W0.right + 0.5 && b.top >= W0.top - 0.5 && b.bottom <= W0.bottom + 0.5;
        const outside = b.right <= W0.left || b.left >= W0.right || b.bottom <= W0.top || b.top >= W0.bottom;
        if (!inside && !outside) fails.push(`${tag}: "${t.textContent.trim().slice(0, 20)}" cut by the rim`);
      }
      const card = box(svg, 'lzs-ev-in-sheet');
      if (card.left < W0.left - 0.5 || card.right > W0.right + 0.5 || card.top < W0.top - 0.5 || card.bottom > W0.bottom + 0.5) fails.push(`${tag}: the event card cut by the rim`);
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
      const S = box(svg, 'lens-src');
      for (const n of ['st-A-head', 'st-B-head']) { const hb = box(svg, n); if (hb && hb.right > S.left && hb.left < S.right && hb.bottom > S.top && hb.top < S.bottom) fails.push(`${tag}: source frame over ${n}`); }
      for (const t of svg.querySelectorAll('[data-node^="st-"] text')) {
        if (eff(svg, t) < 0.15 || t.closest('[data-node="st-ev"]')) continue;
        const b = t.getBoundingClientRect();
        const crossesV = [S.left, S.right].some(xx => xx > b.left && xx < b.right && S.bottom > b.top && S.top < b.bottom);
        const crossesH = [S.top, S.bottom].some(yy => yy > b.top && yy < b.bottom && S.right > b.left && S.left < b.right);
        if (crossesV || crossesH) fails.push(`${tag}: source frame crosses "${t.textContent.trim().slice(0, 20)}"`);
      }
      x.destroy();
      el.remove();
    }
    return {fails: [...new Set(fails.map(f => f.replace(/ t\d+:/, ':')))], rows};
  }, [ID, presets, RATIOS, HELP]);
  console.log(out.rows.join('\n'));
  expect(out.fails.slice(0, 30)).toEqual([]);
});

// Rest magnification at sized hosts: the lens copy of the event card is ≥ 1.5× the card at rest, in both dimensions, at
// a 640×360 element and in 800×600 and 1400×1000 viewports (every preset × labels).
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
        const rest = x.element.querySelector('[data-node="st-ev-in-sheet"]').getBoundingClientRect();
        x.seek(0.6 * x.durationMs);
        const lz = x.element.querySelector('[data-node="lzs-ev-in-sheet"]').getBoundingClientRect();
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

// Labels hidden: a visible non-text change inside the open lens — the state glyph turns ● → ◆ (or back) inside the window.
test(`${ID}: labels hidden — the state glyph turns inside the lens (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    for (const pr of presets) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: 'none'}});
      await x.ready;
      const s0 = x.getState({bounds: false}).semantic;
      const vis = (st) => { const g = x.element.querySelector(`[data-node="lzs-ev-in-st-${st}"]`); let v = 1; for (let q = g; q && q !== x.element; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null) v *= parseFloat(a); } return {v, b: g.querySelector('circle, path').getBoundingClientRect()}; };
      x.seek(0.44 * x.durationMs);
      const a = vis(s0.before);
      x.seek(0.6 * x.durationMs);
      const b = vis(s0.after), a2 = vis(s0.before);
      const W = x.element.querySelector('[data-node="lens-border"]').getBoundingClientRect();
      const inW = q => q.left > W.left && q.right < W.right && q.top > W.top && q.bottom < W.bottom;
      if (s0.before !== s0.after && !(a.v > 0.5 && b.v > 0.5 && a2.v < 0.05)) fails.push(`${pr.name} ${ratio}: the glyph does not turn in the lens`);
      if (!inW(a.b) || !inW(b.b)) fails.push(`${pr.name} ${ratio}: the glyph leaves the lens`);
      x.destroy();
      el.remove();
    }
    return fails;
  }, [ID, presets, RATIOS]);
  expect(out).toEqual([]);
});

// Labels key / none (cf-08 / cf-10 rulings; coordinator ruling 2026-10-05 on the cf precedent LAW-0472/0476/0480/0492):
// the scene (its rendered box) takes ≥ 0.55 of the frame width at rest (u 0.05) and at the hold (u 1), at 16:9 and 1:1;
// at 60 fps the context is never below its rest size for more than 150 ms without the lens on screen.
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

// The Δ marker is clear of every text and in the frame at the hold (labels all / key, every preset × ratio).
test(`${ID}: the Δ marker is clear of every text (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    for (const pr of presets) for (const [ratio, w, h] of ratios) for (const tv of ['all', 'key']) {
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
      for (const n of ['st-br-art-brace', 'st-ev-in-sheet']) { const b = svg.querySelector(`[data-node="${n}"]`).getBoundingClientRect(); if (b.right > d.left && b.left < d.right && b.bottom > d.top && b.top < d.bottom) fails.push(`${pr.name} ${ratio} ${tv}: Δ over ${n}`); }
      x.destroy();
      el.remove();
    }
    return fails;
  }, [ID, presets, RATIOS]);
  expect(out).toEqual([]);
});

// Produced and pending drawn alike (rendered): the panel's ● and ◆ legend glyphs have the same area (± 8 %), fill and
// stroke; the two state rows of the event card are fitted to one card size.
test(`${ID}: produced and pending drawn alike (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, {name: 'es-only', params: {locale: 'es'}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let n = 0;
    for (const pr of presets) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      x.seek(x.durationMs);
      const svg = x.element;
      const gl = s => { const g = svg.querySelector(`[data-node="h-leg-${s}"]`); return g ? [...g.children].find(e => e.tagName === 'circle' || (e.tagName === 'path' && e.getAttribute('stroke-linejoin'))) : null; };
      const a = gl('produced'), b = gl('pending');
      if (a && b) {
        n++;
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        const areaA = Math.PI * (ra.width / 2) ** 2, areaB = rb.width * rb.height / 2;
        if (Math.abs(areaA - areaB) / areaA > 0.08) fails.push(`${pr.name} ${ratio}: ● ${areaA.toFixed(0)} vs ◆ ${areaB.toFixed(0)} px²`);
        if (a.getAttribute('fill') !== b.getAttribute('fill') || a.getAttribute('stroke-width') !== b.getAttribute('stroke-width')) fails.push(`${pr.name} ${ratio}: glyph fill / stroke differ`);
      }
      x.destroy();
      el.remove();
    }
    return {fails, n};
  }, [ID, presets, RATIOS]);
  expect(out.n).toBeGreaterThan(5);
  expect(out.fails).toEqual([]);
});

noOneWordLines(ID);
noLoneLetterSplit(ID);
noTornNumberUnit(ID);
esAportadoAgrees(ID);

// Print-bar fallback (reviewer requests, 2026-10-05; fix2): supplied texts too long for a printed card in the context — an
// unbroken long word — are drawn as print bars PER CARD (the event card, the obligation cards: a long obligation never
// turns the event card into bars). The texts of the barred cards are listed once in the panel at rest; a barred event card
// is printed at its true size in the lens once fully open (old state, then the new one), its print filling the lens window
// (union of its text ≥ 0.35 of the window) with the card's inner padding (state glyph ≥ 14 px from the rim); the context
// card never carries a legible print; the Δ and the hold work as usual, and every case renders a full scene.
test(`${ID}: print-bar fallback — per card, texts listed in the panel, printed only in the lens (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const stress = P('long-labels-stress');
  const cands = [
    {name: 'long-obligation', params: {obligations: ['Obligation-with-an-extraordinarily-long-hyphenated-name 1', 'Obligation 2 (supplied text)', 'Obligation 3 (supplied text)']}},
    {name: 'obligation-token42', params: {obligations: ['Gewaehrleistungsverpflichtungsvereinbarung 1', 'Obligation 2 (supplied text)']}},
    {name: 'event-token42', params: {event: {label: 'Event Gewaehrleistungsverpflichtungsvereinbarung 1'}}},
    {name: 'stress-event-token33', params: {...stress, event: {label: 'Event Vertragserfuellungsbedingungenxyz 1'}}},
    {name: 'both-tokens', params: {event: {label: 'Event Vertragserfuellungsbedingungenxyz 1'}, obligations: ['Gewaehrleistungsverpflichtungsvereinbarung 1', 'Obligation 2 (supplied text)']}},
    {name: 'stress-long-word', params: {...stress, obligations: ['Obligation-with-an-extraordinarily-long-hyphenated-name 1', ...stress.obligations.slice(1)]}},
  ];
  const out = await page.evaluate(async ([id, cands, ratios, HELP]) => {
    eval(HELP.replace(/const /g, 'globalThis.'));
    const def = await window.__lib.load(id);
    const fails = [], rows = [];
    let evBars = 0, oblBars = 0, perCard = 0;
    for (const c of cands) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: c.params});
      await x.ready;
      const svg = x.element;
      const k = 1080 / Math.min(w, h) * (w / svg.getBoundingClientRect().width);
      const tag = `${c.name} ${ratio}`;
      x.seek(0.1 * x.durationMs);
      const s0 = x.getState({bounds: false}).semantic;
      rows.push(`${tag}: event printed ${s0.cardText} · obligations printed ${s0.oblText} · layoutOk ${s0.layoutOk} text ${s0.textPx}px`);
      if (!s0.layoutOk || !svg.querySelector('[data-node="st-ev-in-sheet"]')) { fails.push(`${tag}: no full scene (${s0.why})`); x.destroy(); el.remove(); continue; }
      const norm = t => t.replace(/[ ⁠]/g, ' ').replace(/\s+/g, ' ').trim();
      const shown = sel => [...svg.querySelectorAll(sel)].filter(t => eff(svg, t) >= 0.5).map(t => norm(t.textContent)).join(' ');
      const rest = shown('[data-node="panel-rest"] text');
      const label = c.params.event?.label ?? def.defaultParams.event.label;
      const obls = c.params.obligations ?? def.defaultParams.obligations;
      const evText = svg.querySelectorAll('[data-node="st-ev-in"] text').length;
      const oblText = svg.querySelectorAll('[data-node^="st-obl"] text').length;
      // per card: each card printed or barred on its own
      if (s0.cardText === false && evText) fails.push(`${tag}: the barred event card carries text`);
      if (s0.cardText !== false && !evText) fails.push(`${tag}: the printed event card has no text`);
      if (s0.oblText === false && oblText) fails.push(`${tag}: the barred obligation cards carry text`);
      if (s0.oblText !== false && !oblText) fails.push(`${tag}: the printed obligation cards have no text`);
      if (s0.cardText !== s0.oblText) perCard++;
      if (s0.oblText === false) {
        oblBars++;
        for (const t of obls) if (!rest.includes(norm(t).split(' ')[0].slice(0, 12))) fails.push(`${tag}: panel at rest lacks the obligation "${t.slice(0, 20)}"`);
      } else if (rest.includes(norm(obls[0]).slice(0, 18))) fails.push(`${tag}: a printed obligation is listed in the panel as well`);
      if (s0.cardText !== false) { x.destroy(); el.remove(); continue; }
      evBars++;
      for (const word of norm(label).split(' ').slice(0, 3)) if (!rest.includes(word)) fails.push(`${tag}: panel at rest lacks "${word}"`);
      // the lens, fully open: the true-size print with the old state, then the new state, filling the window
      for (const [u, st] of [[0.34, s0.before], [0.62, null]]) {
        x.seek(u * x.durationMs);
        const s = x.getState({bounds: false}).semantic;
        const want = st ?? s.after;
        if (s.lensOpen !== 1 || s.lensState !== want) fails.push(`${tag} u${u}: lens ${s.lensOpen} state ${s.lensState}`);
        if (eff(svg, svg.querySelector('[data-node="lzs-evp"]')) < 0.99) fails.push(`${tag} u${u}: the lens print is not shown`);
        const lens = shown('[data-node="lzs-evp"] text');
        if (!lens.includes(norm(label).split(' ')[0])) fails.push(`${tag} u${u}: the lens print lacks the event label`);
        const W0 = box(svg, 'lens-border');
        const tb = [...svg.querySelectorAll('[data-node="lzs-evp"] text')].filter(t => eff(svg, t) >= 0.5).map(t => t.getBoundingClientRect()).filter(b => b.width);
        for (const b of tb) if (b.left < W0.left - 0.5 || b.right > W0.right + 0.5 || b.top < W0.top - 0.5 || b.bottom > W0.bottom + 0.5) fails.push(`${tag} u${u}: lens print cut by the rim`);
        if (tb.length) {
          const U = {l: Math.min(...tb.map(b => b.left)), r: Math.max(...tb.map(b => b.right)), t: Math.min(...tb.map(b => b.top)), b: Math.max(...tb.map(b => b.bottom))};
          const frac = ((U.r - U.l) * (U.b - U.t)) / (W0.width * W0.height);
          if (frac < 0.35) fails.push(`${tag} u${u}: the lens print fills ${(frac * 100).toFixed(0)} % of the window`);
        }
        const gl = [...svg.querySelectorAll(`[data-node="lzs-evp-in-st-${want}"] > circle, [data-node="lzs-evp-in-st-${want}"] > path`)][0];
        if (gl) { const gap = (gl.getBoundingClientRect().left - W0.left) * k; if (gap < 14) fails.push(`${tag} u${u}: state glyph ${gap.toFixed(1)} px from the lens rim`); }
      }
      // while the lens opens, its fine print is not yet shown (legible only through the open lens)
      x.seek(0.24 * x.durationMs);
      if (eff(svg, svg.querySelector('[data-node="lzs-evp"]')) > 0.01) fails.push(`${tag}: the lens print shows before the lens is open`);
      // the hold: the Δ, the context in its new state
      x.seek(x.durationMs);
      const s1 = x.getState({bounds: false}).semantic;
      if (!s1.markerVisible || s1.contextState !== s1.after || !s1.layoutOk) fails.push(`${tag}: hold marker ${s1.markerVisible} state ${s1.contextState}`);
      x.destroy();
      el.remove();
    }
    return {fails, rows, evBars, oblBars, perCard};
  }, [ID, cands, RATIOS, HELP]);
  console.log(out.rows.join('\n'));
  expect(out.evBars).toBeGreaterThan(3);
  expect(out.oblBars).toBeGreaterThan(3);
  expect(out.perCard).toBeGreaterThan(3);
  expect(out.fails).toEqual([]);
});

// Long unbroken tokens (fix2-contract-terms-04, reviewer request 2026-10-05): a 33-, 42- or 55-character word in the event
// label, an obligation, a state label or a party name — over the default content and over the long-labels-stress content
// — renders a full scene at 16:9, 9:16 and 1:1 (never the empty group of `no-layout-fits`): the kit breaks a word (after
// its own hyphens, else mid-word with a hyphen) only in a second layout pass, when no whole-word layout exists; all text
// stays inside the frame.
test(`${ID}: long unbroken tokens (33/42/55 chars) render a full scene at every ratio (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const stress = P('long-labels-stress');
  const out = await page.evaluate(async ([id, stress]) => {
    const def = await window.__lib.load(id);
    const d = def.defaultParams;
    const TOK = ['Vertragserfuellungsbedingungenxyz', 'Gewaehrleistungsverpflichtungsvereinbarung', 'Gewaehrleistungsverpflichtungsvereinbarungsklauselnabcd'];
    const fails = [];
    let n = 0, slow = 0, broken = 0;
    for (const tok of TOK) for (const [bn, base] of [['default', {}], ['stress', stress]]) for (const field of ['event', 'obligation', 'state', 'name']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const p = structuredClone(base);
      if (field === 'event') p.event = {label: `${tok} 1`};
      if (field === 'obligation') p.obligations = [`${tok} 1`, ...(p.obligations ?? d.obligations).slice(1)];
      if (field === 'state') p.stateLabels = {produced: tok, pending: (p.stateLabels ?? d.stateLabels).pending};
      if (field === 'name') p.parties = [{...(p.parties ?? d.parties)[0], name: tok}, (p.parties ?? d.parties)[1]];
      const tag = `${tok.length} ${bn} ${field} ${ratio}`;
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const t0 = performance.now();
      const x = def.create(el, {width: w, height: h, params: p});
      await x.ready;
      slow = Math.max(slow, performance.now() - t0);
      const svg = x.element;
      const sb = svg.getBoundingClientRect();
      for (const u of [0.6, 1]) {
        x.seek(u * x.durationMs);
        const s = x.getState({bounds: false}).semantic;
        n++;
        if (!s.layoutOk) fails.push(`${tag} u${u}: layoutOk ${s.layoutOk} (${s.why})`);
        if (svg.querySelectorAll('path').length < 30 || !svg.querySelector('[data-node$="board-sheet"]')) fails.push(`${tag} u${u}: no full scene`);
        for (const t of svg.querySelectorAll('text')) {
          const b = t.getBoundingClientRect();
          if (!b.width) continue;
          if (b.left < sb.left - 1 || b.right > sb.right + 1 || b.top < sb.top - 1 || b.bottom > sb.bottom + 1) fails.push(`${tag} u${u}: text outside the frame "${t.textContent.slice(0, 20)}"`);
          if (/\p{L}-$/u.test(t.textContent.trim()) && u === 1) broken++;
        }
      }
      x.destroy();
      el.remove();
    }
    return {fails, n, slow: Math.round(slow), broken};
  }, [ID, stress]);
  console.log(`${ID} long tokens: ${out.n} frames, slowest create ${out.slow} ms, ${out.broken} broken lines seen`);
  expect(out.n).toBe(144);
  expect(out.fails).toEqual([]);
});
