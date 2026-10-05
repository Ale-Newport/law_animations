// LAW-0048 — Cita localizada · inspect. Contract battery + ID-specific checks.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';

// long-labels-stress preset parameters (a two-line substituted value)
const LONG = {"query": "Consolidated Casebook of Illustrative Examples for Teaching, vol. 14, p. 1127,", "sources": ["Journal of Sample Studies in Comparative Procedure", "Consolidated Casebook of Illustrative Examples", "Practice Notes and Commentary"], "citations": [{"source": "Consolidated Casebook of Illustrative Examples", "volume": "Volume 14 (second part)", "page": "page 1127", "paragraph": "paragraph 23"}], "dates": ["Noted on day 12 (log)", "Edition of day 3 (fictional)"], "beforeValue": "paragraph 23", "afterValue": "paragraph 25 (continued)", "pinpointRows": {"before": 2, "after": 4}, "contextLabels": {"context": "The located passage on the reading board of the library nook", "marker": "Pinpoint datum changed"}};

contractSuite('LAW-0048', {
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextDatum === 'before' && s.contextRow === 3", label: 'context shows the before datum at its paragraph'},
    {at: 0.44, fn: "s.lensOpen > 0.9 && s.datum === 'before' && s.lensRow === 3", label: 'the lens opens on the unchanged detail'},
    {at: 0.62, fn: "s.datum === 'changing' && s.contextDatum === 'before' && s.contextRow === 3", label: 'the substitution happens inside the lens only'},
    {at: 0.74, fn: "s.datum === 'after' && s.lensRow === 5 && s.contextRow === 3", label: 'inside the lens the tag and highlight reach the new paragraph'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextDatum === 'after' && s.contextRow === 5 && s.highlight === 1", label: 'returns to context with the new datum at its paragraph'},
    {at: 0.3, fn: "s.contextDatum === 'before' && s.contextRow === 3 && s.datum === 'before'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, fn: 's.source.w > 0 && s.source.h > 0', label: 'the lens keeps a source region in the context'},
    {at: 1, fn: 's.markerClearOfTag', label: 'the changed-datum marker sits outside the new tag and covers none of its value'},
    {at: 1, params: LONG, fn: "s.markerClearOfTag && s.contextDatum === 'after'", label: 'long values: the marker still leaves the whole substituted value readable'},
    {at: 0.82, fn: "s.lensWindow === 1 && s.contextDatum === 'before' && s.contextRow === 3", label: 'the closing lens stays opaque while it moves back (no semi-transparent double image)'},
    {at: 0.8, fn: "s.contextMarks === 'withdrawn' && s.lensWindow === 1", label: 'as the lens flies back the context\'s old tag and highlight have left (never beside the lens\'s new ones)'},
    {at: 0.74, fn: "s.contextMarks === 'before'", label: 'the context keeps its old marks until the return begins'},
    {at: 1, fn: 's.markLabel && s.markLabel.ok', label: 'the changed-datum callout lies on the board, outside the book and the card'},
    {at: 0.845, fn: "s.lensOnSource && s.lensWindow > 0.5 && s.contextRow === 5", label: 'the context takes the new state only while the closed lens covers it exactly'},
    {at: 0.9, fn: "s.lensWindow === 0 && s.lensOpen === 0 && s.contextRow === 5", label: 'the lens has faded completely before the card and marker change'},
    {at: 1, params: {pinpointRows: {before: 3, after: 0}, afterValue: 'not given'}, fn: "s.contextDatum === 'after' && s.contextRow === 0", label: 'removing the pinpoint leaves no paragraph designated'},
  ],
});

// Real frame sizes (the semantic battery above runs at 1920×1080 only): for
// every preset × 16:9/9:16/1:1 the changed-datum marker, once shown, sits
// outside the new tag (reviewer round 3: at 16:9 and 9:16 with long labels it
// had covered the last digit of the substituted value).
test('LAW-0048: changed-datum marker clear of the new tag (all presets × 16:9/9:16/1:1)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = presetsFor('LAW-0048');
  const out = await page.evaluate(async presets => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0048');
    const rows = [];
    for (const pr of presets) {
      for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
        const el = document.createElement('div');
        el.style.cssText = `width:${w / 4}px;height:${h / 4}px`;
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, instanceId: `mk-${rows.length}`, params: pr.params});
        await x.ready;
        const bad = [];
        for (const u of [0.93, 0.96, 1]) {
          x.seek(u * x.durationMs);
          if (!x.getState({bounds: false}).semantic.markerClearOfTag) bad.push(u);
        }
        rows.push({preset: pr.name, ratio, bad});
        x.destroy();
        el.remove();
      }
    }
    return rows;
  }, presets);
  expect(out.filter(q => q.bad.length), JSON.stringify(out)).toEqual([]);
});

// Reviewer round 4: the changed-datum callout overlapped the page (and its
// printed header 'p. 57') in 1:1 and 9:16 and hung past the board edge. For
// every preset × ratio the callout must lie wholly on the reading board,
// outside the open book, the card and the tags (checked from the layout), and
// its rendered box must not intersect the rendered book.
test('LAW-0048: changed-datum callout on the board, clear of the book (all presets × 16:9/9:16/1:1)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = presetsFor('LAW-0048');
  const out = await page.evaluate(async presets => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0048');
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
        const svg = x.element;
        const box = n => n && n.getBoundingClientRect();
        const chipEl = svg.querySelector('[data-node$="mark-chip"]');
        const bookEl = svg.querySelector('[data-node$="st-book-rpage"]');
        const a = box(chipEl), b = box(bookEl);
        const hit = a && b ? a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top : null;
        rows.push({preset: pr.name, ratio, ok: Boolean(s.markLabel && s.markLabel.ok), hit});
        x.destroy();
        el.remove();
      }
    }
    return rows;
  }, presets);
  expect(out.filter(q => !q.ok || q.hit), JSON.stringify(out)).toEqual([]);
});

// Reviewer round 4 (minor): the flying lens covered most of the 'p. 112' tag
// so only '12' showed. A context tag the opaque lens window partly covers must
// be faded out (no readable fragment beside or under the lens).
test('LAW-0048: no context tag is left as a fragment by the flying lens (16:9/9:16/1:1)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async () => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0048');
    const bad = [];
    let i = 0;
    for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
      const el = document.createElement('div');
      el.style.cssText = `width:${w / 4}px;height:${h / 4}px`;
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, instanceId: `fr-${i++}`});
      await x.ready;
      const svg = x.element;
      for (let u = 0.22; u <= 0.845; u += 0.005) {
        x.seek(u * x.durationMs);
        const win = svg.querySelector('[data-node$="lens-bg"]');
        const winG = svg.querySelector('[data-node$="lens-win"]');
        if (!win || Number(winG.getAttribute('opacity') ?? 1) < 0.99) continue;
        const W = win.getBoundingClientRect();
        if (W.width < 2) continue;
        for (const name of ['st-tok-page', 'st-tok-volume']) {
          const n = svg.querySelector(`[data-node$="${name}"]`);
          const op = Number(n.getAttribute('opacity') ?? 1);
          const B = n.getBoundingClientRect();
          const ix = Math.max(0, Math.min(W.right, B.right) - Math.max(W.left, B.left));
          const iy = Math.max(0, Math.min(W.bottom, B.bottom) - Math.max(W.top, B.top));
          const frac = (ix * iy) / (B.width * B.height);
          if (frac > 0.2 && frac < 0.98 && op > 0.05) bad.push({ratio, u: Math.round(u * 1000) / 1000, name, frac: Math.round(frac * 100) / 100, op});
        }
      }
      x.destroy();
      el.remove();
    }
    return bad;
  });
  expect(out, JSON.stringify(out)).toEqual([]);
});

// Reviewer round 5: with long labels the paragraph tag (drawn on the page) hid
// the highlighted paragraph completely in 1:1 (and ~70 % of it in 16:9/9:16),
// and in the lens the enlarged tag overhung the lens border. The tags now sit
// beside the page, pinned to their paragraph's right end. For every preset ×
// 16:9/9:16/1:1 (and with labels hidden) most of the highlight stays visible
// past the tag, on the page and inside the lens, and the resting tags in the
// lens lie wholly inside its window.
test('LAW-0048: highlight stays visible past the paragraph tag; lens tags inside the lens (all presets × 16:9/9:16/1:1)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [...presetsFor('LAW-0048'), {name: 'labels-hidden', params: {textVisibility: 'none'}}, {name: 'long-labels-hidden', params: {...LONG, textVisibility: 'none'}}];
  const out = await page.evaluate(async presets => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0048');
    const opac = el => { let o = 1; for (let n = el; n && n.nodeType === 1 && n.tagName !== 'svg'; n = n.parentNode) { const v = n.getAttribute('opacity'); if (v !== null) o *= Number(v); } return o; };
    const bb = el => { const b = el.getBoundingClientRect(); return {x: b.left, y: b.top, w: b.width, h: b.height}; };
    // fraction of the highlight's area not under any of the boxes (sampled on a grid)
    const visFrac = (hl, covers) => {
      let v = 0, n = 0;
      for (let i = 0; i < 40; i++) for (let j = 0; j < 6; j++) {
        const x = hl.x + (i + 0.5) / 40 * hl.w, y = hl.y + (j + 0.5) / 6 * hl.h;
        n++;
        if (!covers.some(c => x > c.x && x < c.x + c.w && y > c.y && y < c.y + c.h)) v++;
      }
      return v / n;
    };
    const bad = [];
    const seen = {ctx: 0, lens: 0};
    let i = 0;
    for (const pr of presets) {
      for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
        const el = document.createElement('div');
        el.style.cssText = `width:${w / 4}px;height:${h / 4}px`;
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, instanceId: `hl-${i++}`, params: pr.params});
        await x.ready;
        const svg = x.element;
        const q = n => svg.querySelector(`[data-node$="${n}"]`);
        for (const u of [0.2, 0.44, 0.74, 0.93, 1]) {
          x.seek(u * x.durationMs);
          for (const [where, hlN, tags] of [['ctx', 'st-book-hl', ['st-tok-paragraph', 'ctx-after']], ['lens', 'lb-hl', ['lens-st-tok-paragraph', 'lens-after']]]) {
            const hlE = q(hlN);
            if (!hlE || opac(hlE) < 0.5 || Number(hlE.getAttribute('width')) < 1) continue;
            if (where === 'lens' && opac(q('lens-win')) < 0.99) continue;
            const covers = tags.map(q).filter(e => e && opac(e) > 0.3).map(bb);
            if (!covers.length) continue;
            seen[where]++;
            const vis = visFrac(bb(hlE), covers);
            if (vis < 0.75) bad.push({preset: pr.name, ratio, u, where, vis: Math.round(vis * 100) / 100});
          }
          // resting tags inside the lens window
          if (opac(q('lens-win')) > 0.99) {
            const W = bb(q('lens-bg'));
            for (const n of ['lens-st-tok-paragraph', 'lens-after']) {
              const e = q(n);
              if (!e || opac(e) < 0.99) continue;
              const B = bb(e);
              if (B.x < W.x - 0.5 || B.y < W.y - 0.5 || B.x + B.w > W.x + W.w + 0.5 || B.y + B.h > W.y + W.h + 0.5) bad.push({preset: pr.name, ratio, u, tag: n, outside: true});
            }
          }
        }
        x.destroy();
        el.remove();
      }
    }
    return {bad, seen};
  }, presets);
  expect(out.seen.ctx, 'context highlight/tag pairs measured').toBeGreaterThan(30);
  expect(out.seen.lens, 'lens highlight/tag pairs measured').toBeGreaterThan(10);
  expect(out.bad, JSON.stringify(out.bad)).toEqual([]);
});

// Reviewer round 6: in 1:1 with long labels the after chip 'paragraph 25
// (continued)' was wider than the annotation's paper plate and stuck out of its
// left edge over the top shelf (the plate's left edge ignored the after chip).
// For every preset × 16:9/9:16/1:1, at every time the annotation shows, its
// label and both value chips lie inside the plate. Minor: the lens there
// magnified only 1.36×; it now uses the free area under the annotation.
test('LAW-0048: annotation label and both chips inside the plate; lens magnifies (all presets × 16:9/9:16/1:1)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = presetsFor('LAW-0048');
  const out = await page.evaluate(async presets => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0048');
    const bb = el => { const b = el.getBoundingClientRect(); return {x: b.left, y: b.top, w: b.width, h: b.height}; };
    const bad = [];
    const zooms = [];
    let checked = 0;
    let i = 0;
    for (const pr of presets) {
      for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
        const el = document.createElement('div');
        el.style.cssText = `width:${w / 4}px;height:${h / 4}px`;
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, instanceId: `ap-${i++}`, params: pr.params});
        await x.ready;
        const svg = x.element;
        const q = n => svg.querySelector(`[data-node$="${n}"]`);
        for (const u of [0.4, 0.5, 0.64, 0.72, 0.9, 1]) {
          x.seek(u * x.durationMs);
          const P = bb(q('ann-plate'));
          for (const n of ['ann-label', 'ann-before', 'ann-after']) {
            const e = q(n);
            if (!e) { bad.push({preset: pr.name, ratio, u, missing: n}); continue; }
            checked++;
            const B = bb(e);
            if (B.x < P.x - 0.5 || B.y < P.y - 0.5 || B.x + B.w > P.x + P.w + 0.5 || B.y + B.h > P.y + P.h + 0.5) bad.push({preset: pr.name, ratio, u, node: n, outside: true});
          }
        }
        // magnification of the open lens (window width over source width)
        x.seek(0.5 * x.durationMs);
        zooms.push({preset: pr.name, ratio, zoom: Math.round(bb(q('lens-bg')).w / bb(q('lens-src')).w * 100) / 100});
        x.destroy();
        el.remove();
      }
    }
    return {bad, checked, zooms};
  }, presets);
  expect(out.checked, 'annotation items measured').toBeGreaterThan(100);
  expect(out.bad, JSON.stringify(out.bad)).toEqual([]);
  expect(out.zooms.filter(z => z.zoom < 1.45), JSON.stringify(out.zooms)).toEqual([]);
});

// Reviewer round 5 (minor): in 9:16 with long labels the stacked annotation
// plate covered the whole top shelf including its label. In tall frames the
// annotation now spans the free wall in one row when the values only fit side
// by side there, so every shelf label stays visible and uncovered.
test('LAW-0048: 9:16 annotation plate leaves the shelf labels visible (all presets)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = presetsFor('LAW-0048');
  const out = await page.evaluate(async presets => {
    const def = await window.__lib.load('LAW-0048');
    const opac = el => { let o = 1; for (let n = el; n && n.nodeType === 1 && n.tagName !== 'svg'; n = n.parentNode) { const v = n.getAttribute('opacity'); if (v !== null) o *= Number(v); } return o; };
    const bad = [];
    let checked = 0;
    let i = 0;
    for (const pr of presets) {
      const el = document.createElement('div');
      el.style.cssText = 'width:270px;height:480px';
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: 1080, height: 1920, instanceId: `sh-${i++}`, params: pr.params});
      await x.ready;
      x.seek(x.durationMs);
      const svg = x.element;
      const ann = svg.querySelector('[data-node$="-ann"]') || svg.querySelector('[data-node="ann"]');
      const A = ann.getBoundingClientRect();
      const over = (P, Q) => P.left < Q.right && P.right > Q.left && P.top < Q.bottom && P.bottom > Q.top;
      // (the plate of the volume's own shelf row carries the docked source tag instead of its text)
      const src = svg.querySelector('[data-node$="st-tok-source"]').getBoundingClientRect();
      for (const t of svg.querySelectorAll('[data-node*="st-case-plate"][data-node$="-text"]')) {
        checked++;
        const B = t.getBoundingClientRect();
        const hit = over(A, B);
        const hidden = opac(t) < 0.9 && !over(src, B);
        if (hit || hidden) bad.push({preset: pr.name, plate: t.getAttribute('data-node'), hit, op: opac(t)});
      }
      x.destroy();
      el.remove();
    }
    return {bad, checked};
  }, presets);
  expect(out.checked, 'shelf labels measured').toBeGreaterThan(4);
  expect(out.bad, JSON.stringify(out.bad)).toEqual([]);
});
