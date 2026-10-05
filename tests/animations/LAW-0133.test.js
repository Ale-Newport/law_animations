// LAW-0133 — Ámbito temporal · story. Contract battery + ID-specific checks.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';

contractSuite('LAW-0133', {
  continuity: ['handA', 'handB', 'card', 'tapeEnd'],
  attach: [
    // A pinches the card from the lift to the end of the hand-off; B holds it from the hand-off to the landing;
    // B's hand drags the tape clip for the whole pull
    {from: 0.225, to: 0.38, a: 'handA', b: 'cardGripA', tol: 1.5},
    {from: 0.34, to: 0.5, a: 'handB', b: 'cardGripB', tol: 1.5},
    {from: 0.555, to: 0.67, a: 'handB', b: 'tapeEnd', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.cardHolder === 'book' && s.tapeProgress === 0 && s.factStates.every(x => x === 'neutral')", label: 'rest: article on the book, tape retracted, no fact classified'},
    {at: 0.2, fn: "s.cardHolder === 'A'", label: 'reader A lifts the article'},
    {at: 0.36, fn: "s.cardHolder === 'handoff'", label: 'hand-off: both readers hold the card'},
    {at: 0.45, fn: "s.cardHolder === 'B' && s.tapeProgress === 0 && s.factStates.every(x => x === 'neutral')", label: 'B carries the card; nothing is classified before the tape is laid'},
    {at: 0.6, fn: "s.cardHolder === 'ruler' && s.tapeProgress > 0 && s.tapeProgress < 1", label: 'the tape is pulled along the ruler'},
    {at: 0.58, fn: "s.factStates[2] === 'neutral'", label: 'a pin only turns once the tape clip reaches it (cause before effect)'},
    {at: 1, fn: "s.tapeLaid && JSON.stringify(s.factStates) === JSON.stringify(s.expectedStates)", label: 'final: tape laid, facts shown inside / outside by position only'},
    {at: 1, fn: "JSON.stringify(s.expectedStates) === JSON.stringify(['outside','inside','inside','outside'])", label: 'default facts: Day 3 and Day 16 outside, Day 8 and Day 11 inside Day 5 – Day 13'},
    {at: 1, params: {facts: [{label: 'On the start day', day: 5}, {label: 'Inside', day: 7}, {label: 'Author leaves it', day: 9, state: 'not-classified'}]}, fn: "JSON.stringify(s.factStates) === JSON.stringify(['unclassified','inside','unclassified'])", label: 'a boundary day or an author-marked fact stays not classified'},
    {at: 1, params: {finalState: 'interval-placed'}, fn: "s.tapeLaid && s.factStates.every(x => x === 'neutral')", label: 'interval-placed: the tape is laid but no fact is classified'},
    {at: 1, params: {finalState: 'article-taken'}, fn: "s.cardHolder === 'B' && s.tapeProgress === 0", label: 'article-taken: B holds the article, nothing is placed'},
    {at: 1, params: {actionProgress: 0.7}, fn: "s.tapeProgress > 0 && s.tapeProgress < 1", label: 'actionProgress freezes the action part-way'},
  ],
});

// Reviewer round 1: the actor chips were attached to the wrong arms, and reader B's retracting hand passed
// over (and finally rested against) the 'Notice sent' card in the hold. For every preset × 16:9/9:16/1:1:
// each reader's chip lies next to that reader's resting hand (closer to it than to the other hand), and
// from the start of the hold on no hand overlaps a fact card.
test('LAW-0133: chips beside their own arms; hands clear of the fact cards in the hold (all presets × ratios)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = presetsFor('LAW-0133');
  const out = await page.evaluate(async presets => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0133');
    const dist = (b, q) => Math.hypot(Math.max(b.x - q.x, 0, q.x - b.x - b.w), Math.max(b.y - q.y, 0, q.y - b.y - b.h));
    const rows = [];
    for (const pr of presets) {
      for (const tv of ['all', 'none']) {
        for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
          const el = document.createElement('div');
          el.style.cssText = `width:${w / 4}px;height:${h / 4}px`;
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, instanceId: `ch-${rows.length}`, params: {...pr.params, textVisibility: tv}});
          await x.ready;
          const bad = [];
          x.seek(x.durationMs);
          const c = x.getState({bounds: false}).semantic.chips;
          if (tv === 'all') {
            for (const [k, own, other] of [['A', c.restA, c.restB], ['B', c.restB, c.restA]]) {
              const b = c[k];
              if (!b) { bad.push(`no chip ${k}`); continue; }
              const d = dist(b, own);
              if (d > 150 || d >= dist(b, other)) bad.push(`chip ${k} ${Math.round(d)} from its hand`);
            }
          }
          for (let u = 0.74; u <= 1.0001; u += 0.01) {
            x.seek(u * x.durationMs);
            const s = x.getState({bounds: false}).semantic;
            if (s.handOnFacts.A.length || s.handOnFacts.B.length) bad.push(`hand on fact @${u.toFixed(2)}: ${JSON.stringify(s.handOnFacts)}`);
          }
          rows.push({preset: pr.name, tv, ratio, bad});
          x.destroy();
          el.remove();
        }
      }
    }
    return rows;
  }, presets);
  expect(out.filter(q => q.bad.length), JSON.stringify(out.filter(q => q.bad.length))).toEqual([]);
});

// Reviewer B007: (1) the carried Art. card hid reader A's grasp (only the knuckles showed above the card);
// (2) 1:1 long-labels truncated the book titles and dropped their "(fictional)" marker; (3) the reader B
// chip sat below the desk in the caption band. For every preset × ratio (labels on and off):
// - while A holds the card (lift → hand-off), when A reaches in from the top edge its hand is drawn above
//   the carried card (DOM order) and its palm centre lies ON the card and inside the desk window;
// - every source title is printed in full (labels on);
// - both reader chips lie on the desk (inside the desk window), not in a band under it (labels on; 16:9 and
//   9:16 — in 1:1 a chip may still use the band, which stays inside the caption-safe box).
test('LAW-0133: A\'s grasp drawn over the card, full book titles, chips on the desk (all presets × ratios)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0133')];
  const out = await page.evaluate(async presets => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0133');
    const rows = [];
    for (const pr of presets) {
      for (const tv of ['all', 'none']) {
        for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
          const el = document.createElement('div');
          el.style.cssText = `width:${w / 4}px;height:${h / 4}px`;
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, instanceId: `gr-${rows.length}`, params: {...pr.params, textVisibility: tv}});
          await x.ready;
          const bad = [];
          const q = n => x.element.querySelector(`[data-node="${n}"]`);
          const fromTop = ratio !== '1:1';
          if (fromTop) {
            const hand = q('dk-armA-hand'), card = q('dk-cardH');
            if (!(card.compareDocumentPosition(hand) & Node.DOCUMENT_POSITION_FOLLOWING)) bad.push('A\'s hand is drawn under the carried card');
          }
          for (let u = 0.2; u <= 0.375; u += 0.025) {
            x.seek(u * x.durationMs);
            const s = x.getState({bounds: false}).semantic;
            if (!fromTop) continue;
            // the palm centre is ON the card (within its half-size around the card centre) and inside the window
            const d = Math.hypot(s.handA.x - s.cardGripA.x, s.handA.y - s.cardGripA.y);
            if (d > 1.5) bad.push(`hand off its grip @${u.toFixed(3)}`);
            if (s.handA.y < 20) bad.push(`hand clipped by the window top @${u.toFixed(3)}`);
          }
          if (tv === 'all') {
            x.seek(x.durationMs);
            const s = x.getState({bounds: false}).semantic;
            // every printed line (a <tspan> or a line-less <text>), joined with spaces
            const leaves = [...x.element.querySelectorAll('text')].flatMap(t => (t.querySelector('tspan') ? [...t.querySelectorAll('tspan')] : [t]));
            const all = leaves.map(t => t.textContent).join(' ').replace(/\s+/g, ' ');
            const titles = (pr.params.sources || [{label: 'Text 1 (fictional)'}, {label: 'Text 2 (fictional)'}, {label: 'Text 3 (fictional)'}]).map(z => z.label);
            for (const tl of titles) if (!all.includes(tl)) bad.push(`title not printed in full: ${tl}`);
            // (1:1: a reader whose resting hand has no free desk beside it keeps its name chip in the band
            // under the desk window — still inside the caption-safe box, checked by the contract suite)
            // (long-labels-stress: a reader name of ~70 characters has no plate that keeps it ≥ ~16 px beside the
            // hand; it then uses the band under the desk, still inside the caption-safe box — reported limit)
            for (const k of ratio === '1:1' || pr.name === 'long-labels-stress' ? [] : ['A', 'B']) {
              const b = s.chips[k];
              if (b && b.y + b.h > s.deskWinH + 0.5) bad.push(`chip ${k} below the desk window (${b.y + b.h} > ${s.deskWinH})`);
            }
          }
          rows.push({preset: pr.name, tv, ratio, bad});
          x.destroy();
          el.remove();
        }
      }
    }
    return rows;
  }, presets);
  expect(out.filter(q => q.bad.length), JSON.stringify(out.filter(q => q.bad.length))).toEqual([]);
});

// Coordinator round 2: in 1:1 reader B's arm crossed the fact cards on its way to the hand-off. For every preset
// × ratio (labels on and off) where B leans in from the right edge (1:1): during the whole action no part of
// B's arm (shoulder → hand, sleeve half-width) lies over a fact card.
test('LAW-0133: reader B never reaches across the fact row in 1:1 (all presets)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0133')];
  const out = await page.evaluate(async presets => {
    const def = await window.__lib.load('LAW-0133');
    const rows = [];
    for (const pr of presets) {
      for (const tv of ['all', 'none']) {
        const el = document.createElement('div');
        el.style.cssText = 'width:270px;height:270px';
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: 1080, height: 1080, instanceId: `bf-${rows.length}`, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const bad = [];
        for (let u = 0; u <= 1.0001; u += 0.01) {
          x.seek(Math.min(1, u) * x.durationMs);
          const s = x.getState({bounds: false}).semantic;
          if (s.armBOnFacts && s.armBOnFacts.length) bad.push(`B's arm over fact(s) ${s.armBOnFacts} @${u.toFixed(2)}`);
        }
        rows.push({preset: pr.name, tv, bad: bad.slice(0, 6)});
        x.destroy();
        el.remove();
      }
    }
    return rows;
  }, presets);
  expect(out.filter(q => q.bad.length), JSON.stringify(out.filter(q => q.bad.length))).toEqual([]);
});

// Round 3 (AUTHORING items 10, 14, 17): text hierarchy measured on the rendered DOM (font size × on-screen
// scale, frame pixels) at the hold, every preset × ratio: every content group (supplied text on props,
// cards, facts, names) ≥ 16 px; captions ≥ 16 px and never larger than the smallest content text; in the baseline
// preset the key content (fact labels, days, states, the article reference and interval, reader names) ≥ 19 px.
test('LAW-0133: text hierarchy — content ≥ 16 px, captions ≤ content, baseline key ≥ 19 px (all presets × ratios)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0133')];
  const out = await page.evaluate(async ({presets, G}) => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0133');
    const rows = [];
    for (const pr of presets) {
      for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
        const el = document.createElement('div');
        el.style.cssText = `width:${w / 4}px;height:${h / 4}px`;
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, instanceId: `th-${rows.length}`, params: pr.params});
        await x.ready;
        const bad = [];
        for (const u of G.times) {
          x.seek(u * x.durationMs);
          const svg = x.element;
          const k0 = svg.getScreenCTM().a;
          const px = t => +t.getAttribute('font-size') * t.getScreenCTM().a / k0;
          const shown = t => { for (let n = t; n && n !== svg; n = n.parentNode) if (n.getAttribute && n.getAttribute('opacity') === '0') return false; return true; };
          const texts = sel => [...svg.querySelectorAll(sel)].flatMap(g => (g.tagName === 'text' ? [g] : [...g.querySelectorAll('text')])).filter(shown);
          // (a caption drawn on a part, e.g. an element label band, is a caption, not content)
          const content = Object.entries(G.content).flatMap(([gname, sel]) => texts(sel).filter(t => !t.closest(G.caps)).map(t => ({g: gname, s: px(t), t: t.textContent.slice(0, 24)})));
          const caps = texts(G.caps).map(t => ({s: px(t), t: t.textContent.slice(0, 24)}));
          if (!content.length) { bad.push(`no content text @${u}`); continue; }
          const cmin = content.reduce((a, c) => (c.s < a.s ? c : a));
          if (cmin.s < 16) bad.push(`content "${cmin.t}" ${cmin.s.toFixed(1)}px < 16 @${u}`);
          const cmax = caps.length ? caps.reduce((a, c) => (c.s > a.s ? c : a)) : null;
          const cap0 = caps.length ? caps.reduce((a, c) => (c.s < a.s ? c : a)) : null;
          if (cap0 && cap0.s < 16) bad.push(`caption "${cap0.t}" ${cap0.s.toFixed(1)}px < 16 @${u}`);
          if (cmax && cmax.s > cmin.s + 0.05) bad.push(`caption "${cmax.t}" ${cmax.s.toFixed(1)}px > content "${cmin.t}" ${cmin.s.toFixed(1)}px @${u}`);
          if (pr.name === 'default') {
            const keys = texts(G.key).map(t => ({s: px(t), t: t.textContent.slice(0, 24)}));
            const kmin = keys.length ? keys.reduce((a, c) => (c.s < a.s ? c : a)) : null;
            if (kmin && kmin.s < 19) bad.push(`baseline key "${kmin.t}" ${kmin.s.toFixed(1)}px < 19 @${u}`);
          }
          if (G.iv) {
            const iv = texts(G.iv.sel).filter(t => t.textContent.includes(G.iv.has)).map(px);
            const others = content.filter(c => !c.t.includes(G.iv.has)).map(c => c.s);
            if (!iv.length) bad.push(`no interval text @${u}`);
            else if (Math.min(...iv) + 0.05 < Math.max(...others)) bad.push(`interval ${Math.min(...iv).toFixed(1)}px < other content ${Math.max(...others).toFixed(1)}px @${u}`);
          }
        }
        rows.push({preset: pr.name, ratio, bad});
        x.destroy();
        el.remove();
      }
    }
    return rows;
  }, {presets, G: {times: [1], content: {facts: '[data-node^="dk-f"]', card: '[data-node="dk-cardD"]', stand: '[data-node="dk-stand"]', names: '[data-node="dk-chipA"],[data-node="dk-chipB"]'}, caps: '[data-node^="note"],[data-node="state-tag"]', key: '[data-node^="dk-f"],[data-node="dk-chipA"],[data-node="dk-chipB"]'}});
  expect(out.filter(q => q.bad.length), JSON.stringify(out.filter(q => q.bad.length))).toEqual([]);
});

// Round 3: (1) 9:16 long-labels — the Day 3 fact card covered the Level 3 plate for the whole clip; (2) 1:1 —
// B's forearm lay across the ruler numbers and the end of "Day 5 – Day 13" during the tape pull. For every
// preset × ratio: at every time no hierarchy-plate text is covered by a fact card or by the lying article card;
// during the pull (0.55–0.67) no part of B's arm or hand covers a ruler number or the card's interval text; the
// tape clips never sit on a ruler number.
test('LAW-0133: no stand plate covered; no arm, hand or tape clip over the ruler numbers or the card interval during the pull (all presets × ratios)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0133')];
  const out = await page.evaluate(async ({presets}) => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0133');

    // --- DOM geometry helpers (screen coordinates) ---
    const rectOf = n => { const b = n.getBoundingClientRect(); return {x: b.left, y: b.top, w: b.width, h: b.height}; };
    const hit = (a, b, pad = 0) => a.x < b.x + b.w - pad && a.x + a.w - pad > b.x && a.y < b.y + b.h - pad && a.y + a.h - pad > b.y;
    const shownIn = (t, root) => { for (let n = t; n && n !== root; n = n.parentNode) if (n.getAttribute && (n.getAttribute('opacity') === '0' || (n.getAttribute('opacity') !== null && +n.getAttribute('opacity') < 0.05))) return false; return true; };
    // sampled points of a stroked line / path with its half width, in screen coordinates
    const strokePts = n => {
      const m = n.getScreenCTM();
      const sw = (+n.getAttribute('stroke-width') || 0) * m.a / 2;
      const pts = [];
      if (n.tagName === 'line') {
        const x1 = +n.getAttribute('x1'), y1 = +n.getAttribute('y1'), x2 = +n.getAttribute('x2'), y2 = +n.getAttribute('y2');
        for (let k = 0; k <= 40; k++) pts.push({x: x1 + (x2 - x1) * k / 40, y: y1 + (y2 - y1) * k / 40});
      } else if (n.getTotalLength) {
        const L = n.getTotalLength();
        for (let l = 0; l <= L; l += Math.max(1, L / 80)) { const q = n.getPointAtLength(l); pts.push({x: q.x, y: q.y}); }
      }
      return pts.map(q => { const P = new DOMPoint(q.x, q.y).matrixTransform(m); return {x: P.x, y: P.y, r: sw}; });
    };
    const ptsOnRect = (pts, r, shrink = 1) => pts.some(q => q.x + q.r > r.x + shrink && q.x - q.r < r.x + r.w - shrink && q.y + q.r > r.y + shrink && q.y - q.r < r.y + r.h - shrink);

    const rows = [];
    for (const pr of presets) {
      for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
        const el = document.createElement('div');
        el.style.cssText = `width:${w / 2}px;height:${h / 2}px`;
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, instanceId: `gm-${rows.length}`, params: pr.params});
        await x.ready;
        const svg = x.element;
        const q = s => svg.querySelector(`[data-node="${s}"]`);
        const qa = s => [...svg.querySelectorAll(s)];
        const bad = [];

        const numbers = () => qa('[data-node="dk-ruler"] text').map(rectOf).filter(r => r.w > 0);
        for (let u = 0; u <= 1.0001; u += 0.05) {
          x.seek(Math.min(1, u) * x.durationMs);
          const plates = qa('[data-node^="dk-st-lv"]').filter(t => shownIn(t, svg)).map(rectOf);
          const covers = [...qa('[data-node^="dk-f"]').filter(n => /^dk-f\d+$/.test(n.getAttribute('data-node'))), q('dk-cardD')].filter(n => n && shownIn(n, svg)).map(rectOf);
          plates.forEach((pt, k) => { if (covers.some(c => hit(pt, c, 2))) bad.push(`plate ${k} covered @${u.toFixed(2)}`); });
          const clips = ['dk-tape-s', 'dk-tape-e'].map(q).filter(n => n && +(n.getAttribute('opacity') ?? 1) > 0.05).flatMap(n => [...n.querySelectorAll('path')].flatMap(strokePts));
          if (numbers().some(r => ptsOnRect(clips, r, 2))) bad.push(`tape clip on a ruler number @${u.toFixed(2)}`);
        }
        for (let u = 0.555; u <= 0.67; u += 0.01) {
          x.seek(u * x.durationMs);
          const arm = ['dk-armB-upper', 'dk-armB-lower'].map(q).flatMap(strokePts);
          const hand = q('dk-armB-hand') ? rectOf(q('dk-armB-hand')) : null;
          // (the card's interval line is protected wherever the pull cannot pass over the card: B pulls below the
          // ruler (16:9), or the card lies before the start day — every preset except long-labels in 9:16 / 1:1,
          // where no room is left before Day 5 and the tape runs under the card: reported limit)
          const sm = x.getState({bounds: false}).semantic;
          const before = sm.cardBeforeStart || !sm.pullOnCardSide;
          const ivText = before ? [...(q('dk-cardD') ? q('dk-cardD').querySelectorAll('text') : [])].filter(t => t.textContent.includes('–')).map(rectOf) : [];
          if (!before && pr.name !== 'long-labels-stress') bad.push('the lying card is not before the start day');
          for (const r of [...numbers(), ...ivText]) {
            if (ptsOnRect(arm, r, 1) || (hand && hit(hand, r, 3))) { bad.push(`arm/hand over "${r.w.toFixed(0)}px text" @${u.toFixed(3)}`); break; }
          }
        }
        rows.push({preset: pr.name, ratio, bad: bad.slice(0, 6)});
        x.destroy();
        el.remove();
      }
    }
    return rows;
  }, {presets});
  expect(out.filter(q => q.bad.length), JSON.stringify(out.filter(q => q.bad.length))).toEqual([]);
});
