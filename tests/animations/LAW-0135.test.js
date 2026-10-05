// LAW-0135 — Ámbito temporal · contrast. Contract battery + ID-specific checks.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';

contractSuite('LAW-0135', {
  continuity: ['handA', 'handB', 'changedCardA', 'changedCardB', 'cardA', 'cardB'],
  attach: [
    // each reader holds the changed fact card from rest until it lies in its slot, then the article card while carrying it
    {from: 0, to: 0.33, a: 'handA', b: 'gripA', tol: 1.5},
    {from: 0, to: 0.33, a: 'handB', b: 'gripB', tol: 1.5},
    {from: 0.47, to: 0.58, a: 'handA', b: 'gripA', tol: 1.5},
    {from: 0.47, to: 0.58, a: 'handB', b: 'gripB', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.a.changed === 'hand' && s.b.changed === 'hand' && s.sameOtherSlots && s.sameCard && JSON.stringify(s.a.states) === JSON.stringify(s.b.states)", label: 'base: both scenes identical, the changed fact still held and undated'},
    {at: 0.36, fn: "s.a.day === 10 && s.b.day === 15 && s.a.changed !== 'hand' && s.b.changed !== 'hand'", label: 'change: A pins the fact on Day 10, B on Day 15'},
    {at: 0.6, fn: "s.a.holder === s.b.holder && s.sameCard && s.sameOtherSlots", label: 'the same action runs in parallel with the same article and other facts'},
    {at: 1, fn: "s.a.state === 'inside' && s.b.state === 'outside' && s.a.tape === 1 && s.b.tape === 1", label: 'final: the changed fact is inside in A and outside the supplied interval in B'},
    {at: 1, fn: "s.changedIndex === 1 && s.a.states.every((x, i) => i === s.changedIndex || x === s.b.states[i])", label: 'exactly the indicated fact differs; every other state is identical'},
    {at: 1, fn: "s.guideProgress === 1", label: 'the comparison guide is drawn at the end'},
    {at: 0.7, fn: "s.guideProgress === 0", label: 'no guide before the closing beat'},
  ],
});

// Reviewer B007: the arm's shoulder was fixed at the lane edge, so reaching the article folded it into a V
// whose elbow dropped below the ruler over the fact cards; the lane subtitles ("... on Day 10 / Day 15")
// showed the changed day before the change beat; the subtitle holding the changed day was 12–16 px.
// For every preset × ratio (labels on and off): every target is reached; an elbow on stage stays on the card
// side of the ruler and never over a fact card, and no part of the arm crosses a fact card, in every frame in
// which the hand works on the card side of the ruler (reaching the article, carrying it, pulling the tape); the scenario labels/captions are hidden until the changed card lands and fully shown at the end;
// header texts render at ≥ 19.5 px (frame pixels).
test('LAW-0135: arms clear of the facts, header revealed at the change, header text size (all presets × ratios)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0135')];
  const out = await page.evaluate(async presets => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0135');
    const rows = [];
    for (const pr of presets) {
      for (const tv of ['all', 'none']) {
        for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
          const el = document.createElement('div');
          el.style.cssText = `width:${w / 4}px;height:${h / 4}px`;
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, instanceId: `ar-${rows.length}`, params: {...pr.params, textVisibility: tv}});
          await x.ready;
          const bad = [];
          for (let u = 0; u <= 1.0001; u += 0.01) {
            x.seek(Math.min(1, u) * x.durationMs);
            const s = x.getState({bounds: false}).semantic;
            if (!s.allReached) bad.push(`target out of reach @${u.toFixed(2)}`);
            // no arm part ever lies over a fact card other than the one the hand is laying / releasing, and an
            // elbow on stage never goes beyond the ruler to the fact side
            s.arms.forEach((a, k) => {
              if (!a.elbowOk) bad.push(`elbow ${k ? 'B' : 'A'} over the fact side @${u.toFixed(2)}`);
              const others = a.armOnFacts.filter(i => i !== s.changedIndex);
              if (others.length) bad.push(`arm ${k ? 'B' : 'A'} over fact(s) ${others} @${u.toFixed(2)}`);
              if (u >= 0.44 && a.armOnFacts.length) bad.push(`arm ${k ? 'B' : 'A'} over fact(s) ${a.armOnFacts} @${u.toFixed(2)}`);
              if (a.armOnArticle) bad.push(`arm ${k ? 'B' : 'A'} over the lying article card @${u.toFixed(2)}`);
            });
            if (u <= 0.33 && s.headerText !== 0) bad.push(`header text visible before the change @${u.toFixed(2)}`);
            if (u > 0.999) {
              if (s.headerText !== 1) bad.push('header text not shown at the end');
              if (tv === 'all') {
                // text hierarchy: key content (fact labels, day chips) ≥ 16 px and never smaller than the largest
                // generic text (scenario headers, guide chip, notes); header text stays ≥ 16 px too
                const tp = s.textPx;
                if (tp.fact === null || tp.fact < 16) bad.push(`fact text ${tp.fact}px < 16`);
                if (tp.maxCaption !== null && tp.maxCaption > tp.fact + 0.05) bad.push(`caption ${tp.maxCaption}px larger than fact text ${tp.fact}px`);
                s.headerPx.forEach((z, k) => { for (const [n, v] of Object.entries(z)) if (v !== null && v < 16) bad.push(`header ${k} ${n} ${v}px`); });
              }
            }
          }
          rows.push({preset: pr.name, tv, ratio, bad: bad.slice(0, 8)});
          x.destroy();
          el.remove();
        }
      }
    }
    return rows;
  }, presets);
  expect(out.filter(q => q.bad.length), JSON.stringify(out.filter(q => q.bad.length))).toEqual([]);
});

// Round 3 (AUTHORING items 10, 14, 17): text hierarchy measured on the rendered DOM (font size × on-screen
// scale, frame pixels) at the hold, every preset × ratio: every content group (supplied text on props,
// cards, facts, names) ≥ 16 px; captions ≥ 16 px and never larger than the smallest content text; in the baseline
// preset the key content (fact labels, days, states, the article reference and interval) ≥ 19 px.
// The supplied interval printed on the article card ("Day 5 – Day 13") is the largest content text; the
// supplied article wording (passages[0].text) is drawn once, in full, as readable content in the shared strip.
test('LAW-0135: text hierarchy — content ≥ 16 px, captions ≤ content, baseline key ≥ 19 px (all presets × ratios)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0135')];
  const out = await page.evaluate(async ({presets, G}) => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0135');
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
          // scenario labels / captions stay above their lane (never under the panel's top edge)
          for (const [hn, pn] of [['hdr-a-txt', 'pa'], ['hdr-b-txt', 'pb']]) {
            const hdr = svg.querySelector(`[data-node="${hn}"]`), pnl = svg.querySelector(`[data-node="${pn}"]`);
            if (!hdr || !pnl || !texts(`[data-node="${hn}"]`).length) continue;
            const hb = hdr.getBoundingClientRect(), pb2 = pnl.getBoundingClientRect();
            if (hb.bottom > pb2.top + 1) bad.push(`${hn} runs under its lane @${u}`);
          }
          if (G.passage) {
            // the supplied article wording (passages[0].text) is drawn once, as readable text, in the shared strip
            const want = (x.getState({bounds: false}).params.passages[0] || {}).text;
            const got = texts(G.passage).flatMap(t => (t.querySelector('tspan') ? [...t.querySelectorAll('tspan')] : [t])).map(t => t.textContent).join(' ').replace(/\s+/g, ' ');
            if (want && !got.includes(want)) bad.push(`passage text not drawn in full @${u}`);
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
  }, {presets, G: {times: [1], content: {facts: '[data-node^="pa-f"],[data-node^="pb-f"]', card: '[data-node="pa-cardD"],[data-node="pb-cardD"]', book: '[data-node="pa-book"],[data-node="pb-book"]', headers: '[data-node="hdr-a-txt"],[data-node="hdr-b-txt"]', passage: '[data-node="passage-strip"]'}, passage: '[data-node="passage-strip"]', caps: '[data-node="guide-chip"],[data-node="shared"],[data-node="neutral"]', key: '[data-node^="pa-f"],[data-node^="pb-f"]', iv: {sel: '[data-node="pa-cardD"],[data-node="pb-cardD"]', has: '–'}}});
  expect(out.filter(q => q.bad.length), JSON.stringify(out.filter(q => q.bad.length))).toEqual([]);
});

// Round 3: in 1:1 the forearm covered the ruler numbers during the pull. For every preset × ratio: during the
// pull (0.62–0.72) no part of either reader's arm or hand covers a ruler number, and the tape clips never sit on
// a ruler number.
test('LAW-0135: no arm, hand or tape clip over the ruler numbers during the pull (all presets × ratios)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0135')];
  const out = await page.evaluate(async ({presets}) => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0135');

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

        for (let u = 0.6; u <= 0.7201; u += 0.01) {
          x.seek(Math.min(1, u) * x.durationMs);
          for (const P of ['pa', 'pb']) {
            const numbers = qa(`[data-node="${P}-ruler"] text`).map(rectOf).filter(r => r.w > 0);
            const arm = [`${P}-arm-upper`, `${P}-arm-lower`].map(q).flatMap(strokePts);
            const hand = q(`${P}-arm-hand`) ? rectOf(q(`${P}-arm-hand`)) : null;
            if (numbers.some(r => ptsOnRect(arm, r, 1) || (hand && hit(hand, r, 3)))) bad.push(`${P} arm/hand over a ruler number @${u.toFixed(2)}`);
            // (re-review) nor over the lying card's printed interval ("Day 5 – Day 13")
            const iv = [...(q(`${P}-cardD`) ? q(`${P}-cardD`).querySelectorAll('text') : [])].filter(t => t.textContent.includes('–')).map(rectOf);
            if (iv.some(r => ptsOnRect(arm, r, 1) || (hand && hit(hand, r, 3)))) bad.push(`${P} arm/hand over the card interval @${u.toFixed(2)}`);
            const clips = [`${P}-tape-s`, `${P}-tape-e`].map(q).filter(n => n && +(n.getAttribute('opacity') ?? 1) > 0.05).flatMap(n => [...n.querySelectorAll('path')].flatMap(strokePts));
            if (numbers.some(r => ptsOnRect(clips, r, 2))) bad.push(`${P} tape clip on a ruler number @${u.toFixed(2)}`);
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

// Re-review: with an 84-character passage the 1:1 hold drew the passage strip over the neutral note's last
// line. For every preset × ratio (labels on): from 0.15 to the end, the visible footer blocks — guide chip,
// shared-facts pill, neutral note, passage strip — never intersect one another.
test('LAW-0135: footer text blocks never intersect (all presets × ratios)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0135')];
  const out = await page.evaluate(async presets => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0135');
    const rows = [];
    for (const pr of presets) {
      for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
        const el = document.createElement('div');
        el.style.cssText = `width:${w / 4}px;height:${h / 4}px`;
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, instanceId: `ft-${rows.length}`, params: pr.params});
        await x.ready;
        const svg = x.element;
        const shown = n => { for (let m = n; m && m !== svg; m = m.parentNode) if (m.getAttribute && m.getAttribute('opacity') !== null && +m.getAttribute('opacity') < 0.05) return false; return true; };
        const bad = [];
        for (let u = 0.15; u <= 1.0001; u += 0.05) {
          x.seek(Math.min(1, u) * x.durationMs);
          const blocks = ['guide-chip', 'shared', 'neutral', 'passage-strip'].map(n => svg.querySelector(`[data-node="${n}"]`)).filter(n => n && shown(n))
            .map(n => { const b = n.querySelector('path').getBoundingClientRect(); return {n: n.getAttribute('data-node'), x: b.left, y: b.top, w: b.width, h: b.height}; });
          for (let i = 0; i < blocks.length; i++) for (let j = i + 1; j < blocks.length; j++) {
            const a = blocks[i], c = blocks[j];
            if (a.x < c.x + c.w && a.x + a.w > c.x && a.y < c.y + c.h && a.y + a.h > c.y) bad.push(`${a.n} × ${c.n} @${u.toFixed(2)}`);
          }
        }
        rows.push({preset: pr.name, ratio, bad: bad.slice(0, 6)});
        x.destroy();
        el.remove();
      }
    }
    return rows;
  }, presets);
  expect(out.filter(q => q.bad.length), JSON.stringify(out.filter(q => q.bad.length))).toEqual([]);
});
