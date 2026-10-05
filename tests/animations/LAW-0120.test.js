// LAW-0120 — Límite de una conclusión · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates (the lens starts as a scale-1 copy exactly on the
// focus card of the thumbnail), the change is localised (one datum, then only the cord around that card and
// its marker change) and seeking back restores exactly the previous datum and cord.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {test, expect} from '@playwright/test';
import {suppliedTextSuite, RATIOS} from '../harness/supplied-text.js';

const BEFORE = 'Notice sent only by text message';
const AFTER = 'Notice sent by text message and pinned on the hall board';
const SHAPES = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.366, bottom: 0.2, left: 0.366}}};
const variants = [['default', {}], ...presetsFor('LAW-0120').map(pr => [pr.name, pr.params]), ['labels-none', {textVisibility: 'none'}]];
// at the hold: the changed-datum tag lies clear of the cord (never inside an outline); the cord keeps its distance
// from every card and encloses exactly the covered ones (the focus card with its supplied after-scope)
const hold = variants.flatMap(([name, params]) => Object.entries(SHAPES).map(([shape, sa]) => ({
  at: 1, params: {...params, ...sa},
  fn: 's.tagFree && s.tagClearOfCord && s.cordClear && s.focusInsideLoop === (s.scopeAfter === "included") && JSON.stringify(s.othersInsideLoop) === JSON.stringify(s.otherScopes.map(x => x === "included"))',
  label: `hold: tag clear of the cord; the cord encloses exactly the covered cards (focus: its after-scope) (${name}, ${shape})`,
})));
const each = (times, fn, label) => variants.flatMap(([name, params]) => Object.entries(SHAPES).flatMap(([shape, sa]) => times.map(at => ({
  at, params: {...params, ...sa}, fn: typeof fn === 'function' ? fn(shape) : fn, label: `${label} (${name}, ${shape}) @${at}`,
}))));
// review fixes (round 2)
const fixes = [
  // the re-laid cord never runs over a card or its text: it is pulled back along the old loop and paid out along
  // the new one (lens and thumbnail share the same geometry)
  ...each([0.15, 0.5, 0.645, 0.66, 0.675, 0.69, 0.7, 0.71, 0.72, 0.73, 0.75, 1], '!s.cordOverCards', 're-lay: the cord never crosses a card'),
  // the struck slip travels to its tag around the cards, never over a card header or text, the plaque or the caption
  ...each([0.74, 0.75, 0.76, 0.77, 0.78, 0.79], 's.slipRouteClear && !s.slipOverCards', 'return: the slip route is clear of every card'),
  // review round 3: the context grows back WHILE the magnifier closes (never a small thumbnail alone on a blank frame)
  ...each([0.77, 0.785, 0.8], 's.growingWhileClosing === true && s.lensVisible', 'return: the context grows while the lens closes'),
  // the changed-datum tag is tied to its card by a leader line (routed around the other cards)
  ...each([1], 's.tagLeader', 'the tag has a leader to its card'),
  // stacked views: the lens fills its band (no empty lower third) and is a real enlargement
  ...each([0.45], shape => (shape === 'landscape' ? 's.lensFrac.w * s.lensFrac.h >= 0.1' : 's.wideView ? s.lensFrac.w * s.lensFrac.h >= 0.1 : s.inspectCover.h >= 0.95 && s.lensFrac.w * s.lensFrac.h >= 0.12'), 'the lens is large'),
  // the Δ pin uses the neutral "changed" accent (accent2), never the alarm accent
  ...each([1], 's.pinVisible && s.pinNeutral', 'the Δ pin is neutral'),
  // the dim covers the thumbnail's map only (no dimmed empty patch where the hidden notes were)
  ...each([0.4], 's.dimFrameIsMap && s.dim > 0', 'the dim frame is the map'),
  // the inspect band fills the frame: across the width in wide boxes, down the height in square and tall boxes
  // (the square box stacks them when the map is wide, else sets them side by side across the full width)
  ...each([0.45], shape => (shape === 'landscape' ? 's.inspectCover.w >= 0.9 && s.inspectCover.h >= 0.6'
    : shape === 'portrait' ? 's.inspectCover.h >= 0.9 && s.inspectCover.w >= 0.55'
      : '(s.inspectCover.h >= 0.9 && s.inspectCover.w >= 0.45) || (s.inspectCover.w >= 0.95 && s.inspectCover.h >= 0.6)'), 'the thumbnail and lens fill the frame'),
];

contractSuite('LAW-0120', {
  continuity: ['lens', 'slip'],
  attach: [
    // the picked-up slip sits exactly on the old text inside the open lens until it is pulled out
    {from: 0.461, to: 0.499, a: 'slip', b: 'slipHome', tol: 0.6},
    // at the end the slip rests inside the tag, which rides the context as it grows back
    {from: 0.796, to: 1, a: 'slip', b: 'tagSlot', tol: 0.6},
  ],
  semantic: [
    {at: 0.15, fn: `s.contextFull && s.datum === 'before' && s.datumValue === ${JSON.stringify(BEFORE)} && !s.lensVisible && s.scopeNow === 'not-examined' && !s.focusInsideLoop && s.notesVisible`, label: 'build: full context, the old datum on the card, the card outside the cord (as supplied), notes shown'},
    {at: 0.198, fn: 's.lensVisible && s.lensOnCardNow && s.contextShrinking', label: 'isolate: the lens starts as a scale-1 copy exactly on the focus card (source coordinates kept) while the context starts to shrink'},
    ...[0.22, 0.24, 0.26].map(at => ({at, fn: 's.contextShrinking && s.lensVisible && s.lensOpen > 0 && s.lensOpen < 1', label: `isolate: the lens lifts its copy off the card while the context shrinks (never a small thumbnail on a blank frame) @${at}`})),
    {at: 0.29, fn: 's.contextThumb && s.lensVisible && s.lensOpen === 1', label: 'isolate: the lens is fully open as the context reaches its thumbnail'},
    {at: 0.44, fn: "s.lensScale >= 1.5 && s.dim > 0 && s.datum === 'before' && s.relay === 0", label: 'isolate: the card is enlarged, the rest dims; nothing has changed yet'},
    {at: 0.6, fn: "s.oldValueShownIn === 'slip' && s.slip.y > s.lensRect.y + s.lensRect.h && s.relay === 0 && !s.focusInsideLoop", label: 'substitute: the old value leaves the lens as a slip (kept in view); the cord has not moved yet'},
    {at: 0.645, fn: `s.datum === 'after' && s.datumValue === ${JSON.stringify(AFTER)} && s.slipStruck && s.relay === 0`, label: 'substitute: the supplied new value is on the card; the old one is struck on its slip; datum first, geometry after'},
    {at: 0.75, fn: "s.relay === 1 && s.focusInsideLoop && s.scopeNow === 'included' && JSON.stringify(s.othersInsideLoop) === JSON.stringify(s.otherScopes.map(x => x === 'included'))", label: 'only the cord around the focus card changed (re-laid to the scope supplied for after); the other cards keep theirs'},
    ...[0.198, 0.205, 0.21, 0.8, 0.805, 0.81].map(at => ({at, fn: '!s.lensOverSrc || s.rowTextHiddenUnderLens', label: `lens over its own card: the context text waits (no doubled words) @${at}`})),
    {at: 0.797, fn: "s.slipInTag && s.oldValueShownIn === 'tag' && !s.contextFull", label: 'return: the slip reaches its tag while the context grows back'},
    {at: 1, fn: "s.contextFull && !s.lensVisible && s.markerVisible && s.pinVisible && s.slipInTag && s.slipStruck && s.datum === 'after' && s.notesVisible", label: 'return: full context again; the changed card keeps a Δ pin and a tag holding the struck old value'},
    {at: 0.3, fn: `s.datum === 'before' && s.datumValue === ${JSON.stringify(BEFORE)} && s.relay === 0 && !s.focusInsideLoop && s.oldValueShownIn === 'card'`, label: 'seeking back (after the end) restores exactly the old datum and the old cord'},
    {at: 0.75, params: {textVisibility: 'none'}, fn: "s.datum === 'after' && s.focusInsideLoop && s.contextThumb", label: 'labels hidden: the same substitution and re-laid cord happen'},
    {at: 1, params: {afterScope: 'not-examined'}, fn: '!s.focusInsideLoop && s.relay === 1 && s.loopLen > 0', label: 'after-scope supplied as not examined: the cord stays where it was (nothing inferred from the new text)'},
    {at: 1, params: {focusSituation: 0, beforeValue: 'Notice pinned on the hall board a week ahead', afterValue: 'Notice pinned on the hall board a day ahead', afterScope: 'not-examined'}, fn: "s.focus === 0 && !s.focusInsideLoop && s.scopeBefore === 'included' && s.datum === 'after'", label: 'a covered card whose after-scope is supplied as not examined: the cord is re-laid to leave it outside'},
    ...hold,
    ...fixes,
  ],
});

suppliedTextSuite('LAW-0120', {
  fields: 'const f = p.facts.map((x, i) => (i === p.focusSituation ? null : x.text)); return [...f, p.afterValue, p.beforeValue, p.rules.title, p.rules.proposition, ...p.issues, ...p.assumptions, p.contextLabels.context, p.contextLabels.marker];',
  content: 'const f = p.facts.map((x, i) => (i === p.focusSituation ? null : x.text)); return [...f, p.afterValue, p.rules.proposition, ...p.issues, ...p.assumptions];',
  captions: 'return [p.contextLabels.context, p.contextLabels.marker];',
});

// review round 3: on every card the letter-spaced header text ("Situation n") stays clear of the pennant planted in
// the header (measured on the rendered DOM at the hold, every preset × ratio)
test('LAW-0120: card header text never runs under the pennant', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0120')];
  const bad = await page.evaluate(async ([presets, ratios]) => {
    const def = await window.__lib.load('LAW-0120');
    const out = [];
    for (const pr of presets) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      x.seek(x.durationMs);
      const p = x.getState({bounds: false}).params;
      for (const card of x.element.querySelectorAll('[data-node^="c-card"]')) {
        const i = card.getAttribute('data-node').slice(6);
        const flag = card.querySelector(`[data-node="c-flag${i}"]`);
        if (!flag || parseFloat(flag.getAttribute('opacity') || '1') === 0) continue;
        const kind = [...card.querySelectorAll('text')].find(t => t.textContent.trim().startsWith(p.locale === 'es' ? 'Supuesto' : 'Situation'));
        if (!kind) continue;
        const a = kind.getBoundingClientRect(), f = flag.getBoundingClientRect();
        if (a.right > f.left - 1 && a.bottom > f.top && a.top < f.bottom) out.push({preset: pr.name, ratio, card: i, gap: Math.round(f.left - a.right)});
      }
      x.destroy();
      el.remove();
    }
    return out;
  }, [presets, RATIOS]);
  expect(bad).toEqual([]);
});

// review round 4: the lens measured on the rendered page (fraction of the frame) at the substitution beat
test('LAW-0120: the lens is large in every box (rendered DOM)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0120')];
  const rows = await page.evaluate(async ([presets, ratios]) => {
    const def = await window.__lib.load('LAW-0120');
    const out = [];
    for (const pr of presets) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      x.seek(x.durationMs * 0.45);
      const fr = x.element.getBoundingClientRect();
      const lb = x.element.querySelector('[data-node="lz-border"]').getBoundingClientRect();
      out.push({preset: pr.name, ratio, w: lb.width / fr.width, h: lb.height / fr.height});
      x.destroy();
      el.remove();
    }
    return out;
  }, [presets, RATIOS]);
  console.log(JSON.stringify(rows.map(q => [q.preset, q.ratio, +q.w.toFixed(2), +q.h.toFixed(2)])));
  // (width, height, area) as fractions of the frame; 1:1 was 0.34 × 0.30 before round 4
  const min = {'16:9': [0.25, 0.25, 0.08], '9:16': [0.4, 0.2, 0.1], '1:1': [0.4, 0.3, 0.18]};
  for (const q of rows) {
    expect.soft(q.w, `${q.preset} ${q.ratio}: lens width / frame`).toBeGreaterThanOrEqual(min[q.ratio][0]);
    expect.soft(q.h, `${q.preset} ${q.ratio}: lens height / frame`).toBeGreaterThanOrEqual(min[q.ratio][1]);
    expect.soft(q.w * q.h, `${q.preset} ${q.ratio}: lens area / frame`).toBeGreaterThanOrEqual(min[q.ratio][2]);
  }
});

// review round 4: the changed-datum tag's leader crosses no text, no dashed ring and no scope pill (rendered DOM at
// the hold, every preset × ratio; it lands on a card side or ring edge away from text)
test('LAW-0120: the tag leader crosses no text box or dashed ring', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0120')];
  const bad = await page.evaluate(async ([presets, ratios]) => {
    const def = await window.__lib.load('LAW-0120');
    const out = [];
    for (const pr of presets) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      x.seek(x.durationMs);
      const leader = x.element.querySelector('[data-node="tag-leader"]');
      if (!leader) { out.push({preset: pr.name, ratio, why: 'no leader'}); x.destroy(); el.remove(); continue; }
      const tag = x.element.querySelector('[data-node="tag"]');
      const shown = n => { for (let e = n; e && e !== x.element; e = e.parentNode) { const o = e.getAttribute && e.getAttribute('opacity'); if (o !== null && parseFloat(o) === 0) return false; } return true; };
      const texts = [...x.element.querySelectorAll('[data-node="ctx"] text')].filter(t => !tag.contains(t) && shown(t)).map(t => ({r: t.getBoundingClientRect(), s: t.textContent.slice(0, 24)}));
      const rings = [...x.element.querySelectorAll('[data-node^="c-ring"], [data-node^="c-tagIn"], [data-node^="c-tagOut"]')].filter(shown).map(t => ({r: t.getBoundingClientRect(), s: t.getAttribute('data-node')}));
      const len = leader.getTotalLength(), M = leader.getScreenCTM();
      for (let k = 2; k <= 58; k++) {
        const p = leader.getPointAtLength((len * k) / 60);
        const q = new DOMPoint(p.x, p.y).matrixTransform(M);
        const hitB = [...texts, ...rings].find(o => q.x > o.r.left && q.x < o.r.right && q.y > o.r.top && q.y < o.r.bottom);
        if (hitB) { out.push({preset: pr.name, ratio, over: hitB.s}); break; }
      }
      x.destroy();
      el.remove();
    }
    return out;
  }, [presets, RATIOS]);
  expect(bad).toEqual([]);
});
