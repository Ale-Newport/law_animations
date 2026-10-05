// LAW-0134 — Ámbito temporal · mechanism. Contract battery + ID-specific checks.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';

contractSuite('LAW-0134', {
  continuity: ['tracer'],
  semantic: [
    {at: 0.1, fn: "s.relationsDrawn.every(p => p === 0) && !s.tracerVisible", label: 'separate: parts only, no relation drawn yet'},
    {at: 0.3, fn: "s.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)", label: 'relations are drawn one by one'},
    {at: 0.44, fn: "s.relationsDrawn.every(p => p === 1) && s.factStates.every(x => x === 'neutral')", label: 'all supplied relations drawn before the trace; no state shown yet'},
    {at: 1, fn: "s.connectorsLand", label: 'every connector ends on the edge of its own part'},
    {at: 1, fn: "s.causalLinks === 0 && !s.arrowKinds.includes('relation')", label: 'plain relations carry no arrow and nothing is causal by default'},
    {at: 0.6, fn: "s.tracerVisible && s.visited[0] === 'hierarchy'", label: 'the tracer runs during the trace beat'},
    {at: 0.7, fn: "s.focus === 'interval' && s.focusScale > 1.05", label: 'the focus part (interval strip) is enlarged while traced'},
    {at: 0.6, params: {traversalOrder: ['reading', 'article', 'source', 'hierarchy']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['reading','article','source','hierarchy'])", label: 'the tracer follows the supplied traversal order'},
    {at: 0.35, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['hierarchy','source','article','interval','timeline','facts'])", label: 'seeking back keeps the same order'},
    {at: 1, fn: "s.projection === 1 && JSON.stringify(s.factStates) === JSON.stringify(s.expectedStates) && !s.tracerVisible", label: 'gather: projection laid on the axis, states visible, tracer gone'},
    {at: 1, params: {relationships: [{from: 'article', to: 'interval', kind: 'causal'}, {from: 'interval', to: 'timeline', kind: 'relation'}]}, fn: "s.causalLinks === 1 && s.arrowKinds.includes('causal')", label: 'a causal link appears only when supplied'},
  ],
});

// Reviewer round 1: the magnifier parked (and faded in/out) over the legend and a fact card, its handle
// covered the 'laid over' chip, the focus frame ran through the 'Supplied interval' caption and the
// 'positions' chip floated on the projection band. For every preset × 16:9/9:16/1:1 (with and without
// labels): wherever the lens stands still (parked or on the focus) it covers no label, its handle
// crosses no label or part, the focus frame touches no label, every caption and relation chip is placed and no chip
// except the strip-to-axis one sits on the projection column.
test('LAW-0134: magnifier, focus frame and chips clear of labels (all presets × ratios)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = presetsFor('LAW-0134');
  const out = await page.evaluate(async presets => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0134');
    const rows = [];
    for (const pr of presets) {
      for (const tv of ['all', 'none']) {
        for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
          const el = document.createElement('div');
          el.style.cssText = `width:${w / 4}px;height:${h / 4}px`;
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, instanceId: `lm-${rows.length}`, params: {...pr.params, textVisibility: tv}});
          await x.ready;
          const bad = [];
          for (let u = 0.4; u <= 1.0001; u += 0.01) {
            x.seek(u * x.durationMs);
            const s = x.getState({bounds: false}).semantic;
            if (s.lensOnLabels) bad.push(`lens on ${s.lensOnLabels} label(s) @${u.toFixed(2)}`);
            if (s.haloOnLabels) bad.push(`focus frame on label @${u.toFixed(2)}`);
            if (u > 0.99) {
              if (s.lensHandleHits) bad.push(`handle hits ${s.lensHandleHits}`);
              if (s.relChipsMissing) bad.push(`${s.relChipsMissing} relation chip(s) not placed`);
              // every supplied caption and relation chip is drawn (AUTHORING item 14) — no exception
              if (s.labelsMissing) bad.push(`${s.labelsMissing} caption(s)/chip(s) not placed: ${JSON.stringify(s.captionsMissingFor)}`);
              if (s.chipsOnProjection) bad.push(`${s.chipsOnProjection} chip(s) on the projection column`);
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

// Reviewer B007: the "positions" link dropped from an arbitrary ruler point onto one fact card, running as
// a tight pair beside that card's own pin thread; captions hid pin threads (1:1 long labels); long captions
// floated detached without leaders; the lens framed the interval without magnifying it. For every preset ×
// ratio (labels on and off): every relation to "facts" ends on the facts group bracket and keeps ≥ 30 units
// from every pin thread; no caption or relation chip covers a pin thread; any caption not right beside its
// part has a leader; with the interval in focus the glass shows a real enlarged copy (k ≥ 1.5) once it rests
// on the focus. Coordinator round 2: every supplied caption and chip is drawn; fact text ≥ 16 px and ≥ every
// generic label.
test('LAW-0134: facts link on the bracket, threads uncovered, captions tied, lens magnifies (all presets × ratios)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0134')];
  const out = await page.evaluate(async presets => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0134');
    const rows = [];
    for (const pr of presets) {
      for (const tv of ['all', 'none']) {
        for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
          const el = document.createElement('div');
          el.style.cssText = `width:${w / 4}px;height:${h / 4}px`;
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, instanceId: `fb-${rows.length}`, params: {...pr.params, textVisibility: tv}});
          await x.ready;
          const bad = [];
          x.seek(x.durationMs);
          const s = x.getState({bounds: false}).semantic;
          if (s.factsLink) {
            if (!s.factsLink.onBracket) bad.push('facts link does not end on the facts bracket');
            if (s.factsLink.threadClearance < 30) bad.push(`facts link ${s.factsLink.threadClearance} from a pin thread`);
          }
          if (s.labelsOnThreads) bad.push(`${s.labelsOnThreads} label(s) on a pin thread`);
          if (s.captionsDetached.length) bad.push(`detached captions without leader: ${s.captionsDetached}`);
          if (s.labelsTruncated) bad.push(`${s.labelsTruncated} caption(s)/chip(s) cut with an ellipsis`);
          if (tv === 'all') {
            // text hierarchy (AUTHORING item 17): the fact tags carry the key content — ≥ 16 px at the frame's
            // resolution and never smaller than any element caption, relation chip or legend label
            const tp = s.textPx;
            if (tp.fact === null || tp.fact < 16) bad.push(`fact text ${tp.fact}px < 16`);
            if (tp.maxCaption !== null && tp.maxCaption > tp.fact + 0.05) bad.push(`caption ${tp.maxCaption}px larger than fact text ${tp.fact}px`);
            if (s.captionsMissingFor.length || s.relChipsMissingFor.length) bad.push(`not drawn: ${[...s.captionsMissingFor, ...s.relChipsMissingFor]}`);
          }
          if (s.focus === 'interval') {
            let seen = 0;
            for (let u = 0.45; u <= 0.75; u += 0.005) {
              x.seek(u * x.durationMs);
              const m = x.getState({bounds: false}).semantic.magnified;
              if (m && m.visible >= 1 && m.onFocus < 1 && m.k >= 1.5) seen++;
            }
            if (!seen) bad.push('the lens never shows a magnified copy on the focus');
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

// Round 3 (AUTHORING items 10, 14, 17): text hierarchy measured on the rendered DOM (font size × on-screen
// scale, frame pixels) at the hold, every preset × ratio: every content group (supplied text on props,
// cards, facts, names) ≥ 16 px; captions ≥ 16 px and never larger than the smallest content text; in the baseline
// preset the key content (fact tags: labels, days, states) ≥ 19 px.
test('LAW-0134: text hierarchy — content ≥ 16 px, captions ≤ content, baseline key ≥ 19 px (all presets × ratios)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0134')];
  const out = await page.evaluate(async ({presets, G}) => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0134');
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
  }, {presets, G: {times: [1], content: {facts: '[data-node="part-facts"]', card: '[data-node="part-article"]', book: '[data-node="part-source"]', ladder: '[data-node="part-hierarchy"]', note: '[data-node="part-reading"]'}, caps: '[data-node^="cap-"],[data-node^="rl"],[data-node="legend"],[data-node="reading-band"]', key: '[data-node="part-facts"]'}});
  expect(out.filter(q => q.bad.length), JSON.stringify(out.filter(q => q.bad.length))).toEqual([]);
});

// Round 3 (AUTHORING items 5 and 16): in 1:1 the "proposes a reading" connector was ~20 px long and its label
// sat ~150 px away on a leader crossing the "supplies" line. For every preset × ratio (labels on): every
// relation connector is ≥ 56 design units long; every relation label sits beside its own link (within
// max(2.2 × its height, 96) units of the link midpoint) and its leader crosses no other connector.
test('LAW-0134: connectors with length, labels beside their own links (all presets × ratios)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0134')];
  const out = await page.evaluate(async presets => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0134');
    const rows = [];
    for (const pr of presets) {
      for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
        const el = document.createElement('div');
        el.style.cssText = `width:${w / 4}px;height:${h / 4}px`;
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, instanceId: `cl-${rows.length}`, params: pr.params});
        await x.ready;
        x.seek(x.durationMs);
        const s = x.getState({bounds: false}).semantic;
        const bad = [];
        for (const L of s.relLinks) {
          if (L.len < 56) bad.push(`${L.rel} connector ${L.len} units long`);
          if (L.labelDist === null) bad.push(`${L.rel} label not drawn`);
          else {
            if (L.labelDist > Math.max(2.2 * L.labelH, 96)) bad.push(`${L.rel} label ${L.labelDist} from its link`);
            if (L.leaderCrosses) bad.push(`${L.rel} leader crosses ${L.leaderCrosses} connector(s)`);
          }
        }
        rows.push({preset: pr.name, ratio, bad});
        x.destroy();
        el.remove();
      }
    }
    return rows;
  }, presets);
  expect(out.filter(q => q.bad.length), JSON.stringify(out.filter(q => q.bad.length))).toEqual([]);
});
