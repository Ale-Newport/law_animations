// LAW-0136 — Ámbito temporal · inspect. Contract battery + ID-specific checks.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';

contractSuite('LAW-0136', {
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextValue === 13", label: 'context shows the supplied end Day 13'},
    {at: 0.44, fn: "s.lensOpen > 0.9 && s.datum === 'before' && s.lensValue === 13", label: 'lens open on the unchanged detail'},
    {at: 0.44, fn: "Math.abs(s.lensWindow.w / s.lensWindow.h - s.source.w / s.source.h) < 0.02", label: 'the lens is a real enlarged copy of its source region (same proportions)'},
    {at: 0.6, fn: "s.datum === 'changing' && s.lensValue < 13 && s.lensValue > 10 && s.contextValue === 13", label: 'the substitution happens inside the lens only'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextDatum === 'after' && s.contextValue === 10 && JSON.stringify(s.contextStates) === JSON.stringify(s.statesAfter)", label: 'return: the context shows the new end and the dependent states'},
    {at: 1, fn: "JSON.stringify(s.changedFacts) === JSON.stringify([2])", label: 'the change is localized: only the fact on Day 11 changes state'},
    {at: 0.3, fn: "s.contextValue === 13 && s.lensValue === 13 && JSON.stringify(s.lensStates) === JSON.stringify(s.statesBefore)", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: {focusTarget: 'factDay', focusFact: 3, beforeValue: 16, afterValue: 12}, fn: "s.focusTarget === 'factDay' && s.contextValue === 12 && JSON.stringify(s.changedFacts) === JSON.stringify([3])", label: 'fact-day substitution moves only that fact'},
  ],
});

// Reviewer B007: in 16:9 the detail and thumbnail used only ~35 % of the height; in 1:1 the before/after
// chips floated far below the detail between the projection lines, a projection line ran along the struck
// chip and the chips were grey (half faded) at the start of the substitution. For every preset × ratio
// (labels on): the open lens spans ≥ 70 % of the design height in 16:9 and ≥ 60 % in every ratio's longer
// fitting axis; the chips lie INSIDE the open lens, on no card / ruler / pin thread, clear of both projection
// lines, at full opacity from 0.44 to 0.75 (old value not dimmed), and their leader ends on the moving marker.
test('LAW-0136: large lens, chips inside it tied to the marker at full contrast (all presets × ratios)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0136')];
  const out = await page.evaluate(async presets => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0136');
    const rows = [];
    for (const pr of presets) {
      for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
        const el = document.createElement('div');
        el.style.cssText = `width:${w / 4}px;height:${h / 4}px`;
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, instanceId: `ln-${rows.length}`, params: pr.params});
        await x.ready;
        const bad = [];
        for (let u = 0.44; u <= 0.7501; u += 0.01) {
          x.seek(u * x.durationMs);
          const s = x.getState({bounds: false}).semantic;
          const L = s.lensWindow, a = s.ann;
          const cov = Math.max(L.w / s.design.w, L.h / s.design.h);
          if (ratio === '16:9' && L.h / s.design.h < 0.7) bad.push(`lens only ${Math.round(100 * L.h / s.design.h)} % of the height @${u.toFixed(2)}`);
          if (cov < 0.6) bad.push(`lens covers ${Math.round(100 * cov)} % @${u.toFixed(2)}`);
          if (!a) { bad.push('no annotation'); break; }
          const inL = a.box.x >= L.x - 1 && a.box.y >= L.y - 1 && a.box.x + a.box.w <= L.x + L.w + 1 && a.box.y + a.box.h <= L.y + L.h + 1;
          if (!a.inside || !inL) bad.push(`chips outside the lens @${u.toFixed(2)}`);
          if (a.onContent) bad.push(`chips on ${a.onContent} lens item(s) @${u.toFixed(2)}`);
          if (a.onCones) bad.push(`projection line through the chips @${u.toFixed(2)}`);
          if (a.opacity !== 1 || a.beforeOpacity !== 1) bad.push(`chips not at full contrast @${u.toFixed(2)} (${a.opacity})`);
          // (the leader stays short relative to the open lens: ≤ 260 units or ≤ 30 % of the lens width)
          if (!a.lead || Math.hypot(a.lead.to.x - a.lead.from.x, a.lead.to.y - a.lead.from.y) > Math.max(260, 0.3 * L.w)) bad.push(`leader missing or too long @${u.toFixed(2)}`);
        }
        rows.push({preset: pr.name, ratio, bad: bad.slice(0, 8)});
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
// preset the key content (fact labels, days, states in the context view) ≥ 19 px.
test('LAW-0136: text hierarchy — content ≥ 16 px, captions ≤ content, baseline key ≥ 19 px (all presets × ratios)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0136')];
  const out = await page.evaluate(async ({presets, G}) => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0136');
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
  }, {presets, G: {times: [1], content: {facts: '[data-node^="cx-f"]', card: '[data-node="cx-cardD"]', stand: '[data-node="cx-stand"]'}, caps: '[data-node="ctx-caption"],[data-node="marker-chip"],[data-node="thumb-tag"]', key: '[data-node^="cx-f"]'}});
  expect(out.filter(q => q.bad.length), JSON.stringify(out.filter(q => q.bad.length))).toEqual([]);
});

// Round 3 (glyph neutrality, docs/AUTHORING.md Legal content): the changed-datum marker carried a white tick
// (check mark); the lens edge sliced hierarchy plates into clipped fragments; the new end bracket covered the
// ruler number "10". For every preset × ratio: the marker glyph is not a tick / check (a closed delta) and no
// path in the marker has a check shape; the marker chip never overlaps the delta disc (re-review); while the lens is open (0.44–0.75) every visible text of the lens
// copy is either wholly inside or wholly outside the lens window; tape clips and the dashed ghost of the old
// end never sit on a ruler number, in the lens or in the context view.
test('LAW-0136: neutral marker glyph, lens copy without clipped text, no clip on a ruler number (all presets × ratios)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0136')];
  const out = await page.evaluate(async ({presets}) => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const def = await window.__lib.load('LAW-0136');

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

        // (the supplied marker label is drawn in every preset × ratio — AUTHORING item 14)
        x.seek(x.durationMs);
        if (!q('marker-chip')) bad.push('marker label not drawn');
        // the marker chip never covers the neutral Δ disc
        const disc = q('marker-disc'), mchip = q('marker-chip');
        if (disc && mchip) {
          const dr = rectOf(disc), cr = [...mchip.querySelectorAll('path')].map(rectOf)[0];
          if (cr && hit(dr, cr, 0)) bad.push('marker chip overlaps the delta disc');
        }
        const g = q('marker-glyph');
        if (!g || !/Z\s*$/i.test(g.getAttribute('d'))) bad.push('marker glyph is not a closed delta');
        for (const pth of qa('[data-node="marker"] path')) if (/l\s*5\s+5\s*l\s*10\s+-11/.test(pth.getAttribute('d') || '')) bad.push('check-mark path in the marker');
        for (let u = 0.44; u <= 0.7501; u += 0.03) {
          x.seek(u * x.durationMs);
          // (the rendered lens border: a <clipPath> rect is never laid out, so its box would be empty)
          const win = rectOf(q('lens-border'));
          if (win.w < 10) { bad.push(`lens window not measurable @${u.toFixed(2)}`); break; }
          for (const t of qa('[data-node="lens-content"] text').filter(t => shownIn(t, svg))) {
            const r = rectOf(t);
            if (r.w < 1) continue;
            const inside = r.x >= win.x - 1 && r.y >= win.y - 1 && r.x + r.w <= win.x + win.w + 1 && r.y + r.h <= win.y + win.h + 1;
            const outside = !hit(r, win, 0);
            if (!inside && !outside) { bad.push(`clipped lens text "${t.textContent.slice(0, 20)}" @${u.toFixed(2)}`); break; }
          }
        }
        for (const u of [0.46, 0.6, 0.75, 1]) {
          x.seek(u * x.durationMs);
          for (const P of ['ln', 'cx']) {
            const numbers = qa(`[data-node="${P}-ruler"] text`).filter(t => shownIn(t, svg)).map(rectOf).filter(r => r.w > 0);
            const clips = [`${P}-tape-s`, `${P}-tape-e`, `${P}-ghost`].map(q).filter(n => n && shownIn(n, svg) && +(n.getAttribute('opacity') ?? 1) > 0.05).flatMap(n => [...n.querySelectorAll('path')].flatMap(strokePts));
            if (numbers.some(r => ptsOnRect(clips, r, 2))) bad.push(`${P} clip on a ruler number @${u}`);
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
