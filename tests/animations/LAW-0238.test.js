// LAW-0238 — Adaptación de accesibilidad · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends on its element; the order does not change when seeking; a relation is
// never drawn as causality by default (plain relation = solid line with end dots, no arrow; sequence = arrow + the
// caption "sequence as configured (illustrative)"; causal only when supplied).
// Timing (u): the parts slide apart 0.02–0.15, captions and people labels 0.15–0.18; relationships drawn one by one
// 0.20–0.39; the tracer follows the supplied order 0.45–0.72 while the focus part enlarges and the participant on each
// visited part moves along it; the legend 0.75–0.81; everything still from 0.81.
// Legal / content: no standard, measurement, obligation or outcome; people at one scale, as active participants; solid
// strokes only (dashes are reserved for disputed/pending); no red; the key says no conclusion is drawn.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0238';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0.1, fn: "s.slide > 0 && s.slide < 1 && s.relationsDrawn.every(v => v === 0) && !s.tracerVisible", label: 'separate: the parts slide apart; nothing drawn yet'},
    {at: 0.4, fn: "s.slide === 1 && s.relationsDrawn.every(v => v === 1) && !s.tracerVisible", label: 'relate: every supplied relationship drawn'},
    {at: 0.6, fn: "s.tracerVisible && s.visitOrder.length >= 2 && s.visitOrder[0] === 'entrance'", label: 'trace: the tracer follows the supplied order'},
    {at: 1, fn: "!s.tracerVisible && s.visitOrder.join() === 'entrance,strip,room,sign' && s.problems.length === 0 && s.labelsClear", label: 'gather: the whole supplied order visited; labels clear'},
    {at: 1, fn: "s.arrows.every(a => a.kind !== 'relation' || a.arrow === false) && !s.seqCaptions", label: 'plain relations are never arrows; no sequence caption without a sequence link'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.seqCaptions && s.arrows.some(a => a.kind === 'sequence' && a.arrow) && s.visitOrder[0] === 'sign'", label: 'a supplied sequence link is an arrow with its caption; the supplied order is followed'},
    {at: 1, fn: "s.connectorGaps.every(g => g <= 10)", label: 'every connector ends on the edge of its elements'},
    {at: 0.47, fn: "s.focusScale > 1.05 && s.moves.some(m => m > 0)", label: 'the focus part (the entrance, visited first) enlarges while the tracer passes it; its participant moves'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: "s.tracerVisible && s.relationsDrawn.every(v => v === 1)", label: 'labels hidden: the same mechanism runs'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [...p.elements.map(e => e.label), ...p.relationships.map(r => r.label).filter(Boolean), ...p.seats.map(s => s.label), p.labels.key, `${p.courts.building} · ${p.courts.room}`];",
  content: "return [...p.elements.map(e => e.label), ...p.seats.map(s => s.label)];",
  captions: "return [...p.relationships.map(r => r.label).filter(Boolean)];",
});

// ---------------------------------------------------------------------------------------------
const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const EFF = "const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };";
// sample a rendered connector line (screen px)
const LINE = "const linePts = e => { const L = e.getTotalLength(); const m = e.getScreenCTM(); return Array.from({length: 49}, (_, i) => new DOMPoint(e.getPointAtLength(L * i / 48).x, e.getPointAtLength(L * i / 48).y).matrixTransform(m)); };";
// each relation label: >= 20 px (1080p) nearer its own line than any other line, within 36 px of its own line; and no
// line runs under any label, caption or people chip
const REL_LABELS = `(() => { ${K} ${BOX} ${EFF} ${LINE}
  const lines = [...svg.querySelectorAll('[data-node]')].filter(e => /^rel-c\\d+-line$/.test(e.getAttribute('data-node'))).map(e => ({i: +e.getAttribute('data-node').match(/\\d+/)[0], pts: linePts(e)}));
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^rel-l\\d+$/.test(e.getAttribute('data-node')) && eff(e) >= 0.5);
  const dist = (b, pts) => Math.min(...pts.map(q => Math.hypot(Math.max(b.l - q.x, 0, q.x - b.r), Math.max(b.t - q.y, 0, q.y - b.b))));
  for (const l of labs) {
    const i = +l.getAttribute('data-node').match(/\\d+/)[0];
    const b = bx(l.querySelector('path') || l);
    const own = dist(b, lines.find(q => q.i === i).pts) / K;
    if (own > 36) return false;
    if (lines.some(q => q.i !== i && dist(b, q.pts) / K - own < 20)) return false;
  }
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^(rel-l\\d+|cap-w-\\w+|lab\\d+)$/.test(e.getAttribute('data-node')) && eff(e) >= 0.5).map(e => bx(e.querySelector('path') || e));
  return lines.every(q => q.pts.slice(2, -2).every(z => cards.every(c => !(z.x > c.l + 1 && z.x < c.r - 1 && z.y > c.t + 1 && z.y < c.b - 1))));
})()`;
// connectors land on their parts: each end within 12 px of its part's rendered box
const LANDS = `(() => { ${BOX} ${LINE}
  const lines = [...svg.querySelectorAll('[data-node]')].filter(e => /^relw\\d+$/.test(e.getAttribute('data-node')));
  return lines.length > 0 && lines.every(g0 => {
    const rq = {from: g0.getAttribute('data-from'), to: g0.getAttribute('data-to')};
    const e = g0.querySelector('path[data-node$="-line"]');
    const pts = linePts(e);
    const box = id => bx(svg.querySelector('[data-node="el-' + id + '"]'));
    const near = (q, b) => q.x >= b.l - 12 && q.x <= b.r + 12 && q.y >= b.t - 12 && q.y <= b.b + 12;
    return near(pts[0], box(rq.from)) && near(pts[48], box(rq.to));
  });
})()`;
// people chips off props (ramp, steps, strip, sign, room) and off each other; no chip on a head
const CHIPS = `(() => { ${BOX} ${EFF}
  const chips = [...svg.querySelectorAll('[data-node]')].filter(e => /^(lab\\d+-body|rel-l\\d+|cap-w-\\w+)$/.test(e.getAttribute('data-node')) && eff(e) >= 0.5).map(e => bx(e.querySelector && e.querySelector('path') ? e.querySelector('path') : e));
  const heads = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+-head$/.test(e.getAttribute('data-node'))).map(bx);
  // (the strip is L-shaped: its own band rectangles count, not its bounding box)
  const props = [...[...svg.querySelectorAll('[data-node]')].filter(e => /^(ent-ramp|sgn|rm)$/.test(e.getAttribute('data-node'))), ...svg.querySelectorAll('[data-node="str"] > rect')].map(bx);
  return chips.every((c, i) => heads.every(h => !hit(c, h, 1)) && props.every(q => !hit(c, q, 2)) && chips.every((d, j) => j === i || !hit(c, d, 1)));
})()`;
const PEOPLE_SIZE = `(() => { ${K}
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); const r = e.getBoundingClientRect(); return Math.max(hd.width, hd.height) / K >= 26 && Math.max(r.width, r.height) / K >= 60; });
})()`;
const EQUAL_WEIGHT = `(() => {
  const sc = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+-at$/.test(e.getAttribute('data-node'))).map(e => { const m = e.getScreenCTM(); return Math.hypot(m.a, m.b); });
  return sc.length > 0 && Math.max(...sc) / Math.min(...sc) < 1.005;
})()`;
const SOLID = "[...svg.querySelectorAll('[stroke-dasharray]')].every(e => { const n = e.closest('[data-node]'); const nm = n && n.getAttribute('data-node'); if (nm && /^rel-c\\d+-line$/.test(nm)) { const d = e.getAttribute('stroke-dasharray').split(/[ ,]+/).map(Number); return d.length === 2 && d[0] >= e.getTotalLength() - 1; } const d = e.getAttribute('stroke-dasharray'); return !d || d === 'none'; })";
const NO_RED = `(() => {
  const red = c => { const m = /^#([0-9a-f]{6})$/i.exec(c || ''); if (!m) return false; const n = parseInt(m[1], 16), R = n >> 16, G = (n >> 8) & 255, B = n & 255; return R > 170 && G < 90 && B < 90; };
  return [...svg.querySelectorAll('[fill], [stroke]')].every(e => !red(e.getAttribute('fill')) && !red(e.getAttribute('stroke')));
})()`;
const IN_FRAME = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; return p1.x >= -1 && p1.y >= -1 && p2.x <= vb.width + 1 && p2.y <= vb.height + 1; })()";

ratioChecks(ID, 'relation labels by their own line, connectors land, chips off props and faces, solid, no red', [
  {at: [0.45, 0.8, 1], tv: ['all'], dom: REL_LABELS, label: 'rendered: each relation label >= 20 px nearer its own line (<= 36 px from it); no line under a label, caption or chip'},
  {at: [0.4, 1], dom: LANDS, label: 'rendered: every connector starts and ends on its own parts'},
  {at: [0.2, 0.5, 1], dom: CHIPS, label: 'rendered: chips, captions and relation labels off heads, props and each other'},
  {at: [0, 0.1, 0.2, 0.8, 1], dom: PEOPLE_SIZE, label: 'rendered: at rest, build and hold people >= 60 px across, heads >= 26 px (1080p)'},
  {at: [0, 1], dom: EQUAL_WEIGHT, label: 'rendered: every participant at one scale'},
  {at: [0.3, 0.6, 1], dom: SOLID, label: 'rendered: solid strokes only (the draw-on dash of a solid connector excepted)'},
  {at: [0, 0.6, 1], dom: NO_RED, label: 'rendered: no red/alarm colour'},
  {at: times(0, 1, 0.1), dom: IN_FRAME, label: 'rendered: nothing leaves the frame'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);

// Seek identity: seeking to a time from any earlier or later time renders exactly the same SVG
test(`${ID}: seek identity — the render at u does not depend on the previous seek`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const [w, h] of [[1920, 1080], [1080, 1080], [1080, 1920]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h});
      await x.ready;
      for (const u of [0.1, 0.3, 0.55, 0.7, 1]) {
        const snaps = [];
        for (const from of [0, 0.5, 1]) { x.seek(from * x.durationMs); x.seek(u * x.durationMs); snaps.push(x.element.outerHTML); }
        if (new Set(snaps).size !== 1) out.push(`${w}x${h} u=${u}`);
      }
      x.destroy(); el.remove();
    }
    return out;
  }, ID);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Frame fill (rest, build and hold; labels on and hidden): content > 0.5 of the caption-safe box area; never < 0.3 of
// the frame for more than 200 ms
test(`${ID}: content covers > 0.5 of the safe box at rest, build and hold; no < 0.3 frame window over 200 ms`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const res = await page.evaluate(async ([id, ps]) => {
    const def = await window.__lib.load(id);
    const out = [], info = [];
    for (const pr of ps) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
      const vb = svg.viewBox.baseVal, m = svg.getScreenCTM();
      const Fr = {l: m.e + vb.x * m.a, t: m.f + vb.y * m.d, w: vb.width * m.a, h: vb.height * m.d};
      const sa = x.getState({bounds: false}).params.safeArea;
      const S = {l: Fr.l + Fr.w * sa.left, t: Fr.t + Fr.h * sa.top, w: Fr.w * (1 - sa.left - sa.right), h: Fr.h * (1 - sa.top - sa.bottom)};
      // content: every part, connector, label and the legend (their boxes, grown by 24 px of breathing room)
      const cover = R => {
        const parts = [...svg.querySelectorAll('[data-node]')].filter(e => /^(el-\w+|rel-c\d+|rel-l\d+|cap-w-\w+|lab\d+|legend)$/.test(e.getAttribute('data-node')) && eff(e) >= 0.15).map(e => e.getBoundingClientRect()).filter(q => q.width > 0);
        let hit = 0;
        for (let a = 0; a < 40; a++) for (let b = 0; b < 40; b++) {
          const px = R.l + (a + 0.5) * R.w / 40, py = R.t + (b + 0.5) * R.h / 40;
          if (parts.some(q => px >= q.left - 24 && px <= q.right + 24 && py >= q.top - 24 && py <= q.bottom + 24)) hit++;
        }
        return hit / 1600;
      };
      for (const u of [0.05, 0.15, 0.9, 1]) {
        x.seek(u * x.durationMs);
        const c = cover(S);
        info.push(`${pr.name} ${tv} ${ratio} u=${u}: ${c.toFixed(3)}`);
        if (c <= 0.5) out.push(`${pr.name} ${tv} ${ratio} u=${u}: content ${c.toFixed(3)} of the safe box`);
      }
      let run = 0, worst = 0;
      for (let t = 0; t <= x.durationMs; t += 40) {
        x.seek(t);
        if (cover(Fr) < 0.3) { run += 40; worst = Math.max(worst, run); } else run = 0;
      }
      if (worst > 200) out.push(`${pr.name} ${tv} ${ratio}: ${worst} ms under 0.3 of the frame`);
      x.destroy(); el.remove();
    }
    return {out, info};
  }, [ID, presets]);
  console.log(res.info.filter(l => /u=(0.05|1):/.test(l)).join('\n'));
  expect(res.out, res.out.join('\n')).toEqual([]);
});

test(`${ID}: every visible text >= 16 px (>= 19.5 px in baseline and baseline-es) at every sampled u`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) {
      const floor = ['default', 'baseline-illustrative', 'baseline-es'].includes(pr.name) ? 19.5 : 16;
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
            if (pxs < floor - 0.05) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: "${t.textContent.slice(0, 24)}" ${pxs.toFixed(1)} px < ${floor}`);
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

test(`${ID}: cold create() <= 1 s in every preset × ratio`, async ({browser}) => {
  test.setTimeout(300000);
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const slow = [];
  for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
    const page = await browser.newPage();
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const ms = await page.evaluate(async ([id, w, h, params]) => {
      const def = await window.__lib.load(id);
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const t0 = performance.now();
      const x = def.create(el, {width: w, height: h, params});
      await x.ready;
      return performance.now() - t0;
    }, [ID, w, h, pr.params]);
    if (ms > 1000) slow.push(`${pr.name} ${ratio}: ${Math.round(ms)} ms`);
    await page.close();
  }
  expect(slow, slow.join('\n')).toEqual([]);
});

// locale "es" with the default content (courts-10 review): every default left untouched switches to its Spanish
// default, so no English text is drawn anywhere (a supplied value is never replaced).
ratioChecks(ID, 'locale es with default params draws no English', [
  {at: [0.1, 0.3, 0.5, 0.7, 0.9, 1], tv: ['all'], presets: ['baseline-illustrative'], params: {locale: 'es'}, dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Participant|Civic|building|Hearing|room|Room|Ramp|ramp|handrails|Tactile|strip|Wall|sign|supplied|conclusion|drawn|Moves|Walks|wheelchair|cane|Entrance|steps|Steps|Sequence|configured|illustrative|Design|support|Barrier|detected|Only|Same|Changed|winner|outcome|was|Everyone|Connections|relation|has|ends|marks|starts|door|fictional|jurisdiction)\\b/.test(t.textContent))", label: 'no English text with locale es and default params'},
]);

// The tracer never passes over a participant's chip (courts-10 review): at 60 fps, in every preset × ratio × labels
// state, the visible tracer's box never meets a visible people chip (lab{i}) body.
test(`${ID}: the tracer never crosses a participant chip (60 fps)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, ps]) => {
    const def = await window.__lib.load(id);
    const bad = [];
    for (const pr of ps) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined && a !== '') o *= parseFloat(a); } return o; };
      const tr = svg.querySelector('[data-node="tracer"]');
      const chips = [...svg.querySelectorAll('[data-node]')].filter(e => /^lab\d+-body$/.test(e.getAttribute('data-node')));
      const n = Math.round(x.durationMs / (1000 / 60));
      let hits = 0, first = -1;
      for (let i = 0; i <= n; i++) {
        const t = i * x.durationMs / n; x.seek(t);
        if (!tr || eff(tr) < 0.05) continue;
        const a = tr.getBoundingClientRect();
        if (chips.some(c => { if (eff(c) < 0.15) return false; const b = c.getBoundingClientRect(); return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; })) { hits++; if (first < 0) first = t; }
      }
      if (hits) bad.push(`${pr.name} ${tv} ${ratio}: tracer over a chip in ${hits} frames (first ${first.toFixed(0)} ms)`);
      x.destroy(); el.remove();
    }
    return bad;
  }, [ID, presets]);
  expect(out, out.join('\n')).toEqual([]);
});
