// LAW-0102 — Condiciones alternativas · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends at its element (checked while drawing, during the trace and while
// the parts gather), the traversal order does not change when seeking, and a relation is never drawn as
// causation by default (no arrowhead on plain relations; causal style only when supplied).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';

const ID = 'LAW-0102';
const ENDS = 's.linkEnds.every(Boolean)';

contractSuite(ID, {
  continuity: ['tracer', 'lupa'],
  semantic: [
    {at: 0, fn: 's.spread < 1 && s.partsApartAtStart && !s.partsTouch && s.relationsDrawn.every(p => p === 0) && !s.tracerVisible && s.ball === 0 && s.lupaAtRest', label: 'start: parts pushed together (not overlapping), nothing drawn, ball centred, magnifier on the tray'},
    {at: 0.17, fn: 's.spread === 1 && s.relationsDrawn.every(p => p === 0)', label: 'separate: parts apart before any link is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p === 1) && s.relationsDrawn.some(p => p < 1)', label: 'relate: links are drawn one after the other'},
    {at: 0.3, fn: 's.relationsDrawn.every((p, i) => i === 0 || p === 0 || s.relationsDrawn[i - 1] === 1)', label: 'a later link never starts before the previous one is complete'},
    {at: 0.3, fn: ENDS, label: 'links being drawn start on their own parts'},
    {at: 0.44, fn: `s.relationsDrawn.every(p => p === 1) && ${ENDS} && s.linkLengths.every(v => v > 60) && s.ball === 0`, label: 'all supplied links drawn, each from its part to its part, with readable length, before the ball moves'},
    {at: 1, fn: "s.causalCount === 0 && JSON.stringify(s.linkKinds) === JSON.stringify(['relation', 'relation', 'sequence', 'sequence', 'sequence']) && JSON.stringify(s.arrowheads) === JSON.stringify([false, false, true, true, true])", label: 'relations carry no arrowhead; nothing is causal by default'},
    {at: 0.52, fn: "s.tracerVisible && s.visited.length >= 1 && JSON.stringify(s.visited) === JSON.stringify(s.visitOrder.slice(0, s.visited.length)) && JSON.stringify(s.visitOrder) === JSON.stringify(['portA', 'junction', 'point'])", label: 'trace: the tracer visits the parts in the supplied order'},
    {at: 0.57, fn: `s.lupaOverFocus && s.focus === 'junction' && ${ENDS}`, label: 'trace: the magnifier holds over the focus part (real enlarged copy); links stay attached'},
    {at: 0.6, fn: 's.ball > 0.9', label: 'trace: route A arriving at the junction pushes the ball against the B seat'},
    {at: 0.77, fn: `s.spread < 1 && s.spread > s.gathered && ${ENDS}`, label: 'gather: parts slide back toward the junction with their links attached'},
    {at: 1, fn: `s.spread === s.gathered && s.gathered < 1 && ${ENDS} && !s.partsTouch && s.lupaAtRest && !s.tracerVisible`, label: 'hold: gathered mechanism, parts apart, links attached, magnifier back on the tray'},
    {at: 1, fn: 'Object.values(s.gatherMoves).every(v => v >= 25)', label: 'gather: every part visibly moves toward the junction (≥ 25 px at 1080p)'},
    {at: 0.57, fn: 's.lupaOverFocus && s.magnifierPx >= s.valvePx * 0.75', label: 'the magnifier held over the valve is large enough to show a legible enlarged copy of it'},
    {at: 1, fn: "s.stateTag && s.stateTag.includes('Route A') && s.stateTag.includes('Route B') && s.statuses.A === 'supplied' && s.ball > 0.9", label: 'hold: supplied states stay visible (both routes reach the point, as supplied)'},
    {at: 1, fn: 's.notes.issues === 1 && s.notes.key && s.notes.footHasAssumptions', label: 'issue, assumptions and the "as supplied · no conclusion drawn" key are drawn'},
    {at: 1, fn: 's.text.contentPx >= 20 && s.text.keyPx >= 18 && s.text.captionPx >= 16 && s.text.contentPx >= s.text.keyPx && s.text.keyPx >= s.text.captionPx && s.text.captionMisses === 0', label: 'baseline text: content ≥ 20 px, captions never larger than content, every caption placed clear'},
    {at: 1, fn: 's.captionedLinks.spread === s.captionedLinks.links && s.captionedLinks.gathered === s.captionedLinks.links && !s.leadersCross', label: 'EVERY link carries its own caption (spread and gathered layouts); no two leaders cross'},
    // configurable order / focus / kinds
    {at: 0.6, params: {traversalOrder: ['portB', 'junction', 'point'], focusElement: 'portB'}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['portB', 'junction', 'point']) && s.focus === 'portB'", label: 'the tracer follows a different supplied order and focus'},
    {at: 0.72, params: {traversalOrder: ['portB', 'junction', 'point']}, fn: 's.ball < -0.9', label: 'route B arriving pushes the ball the other way (against the A seat)'},
    {at: 1, params: {relationships: [{from: 'portA', to: 'junction', kind: 'causal'}, {from: 'rule', to: 'portA', kind: 'relation'}]}, fn: `s.causalCount === 1 && s.arrowheads[0] === true && s.arrowheads[1] === false && ${ENDS}`, label: 'a causal style appears only when the author supplies it'},
    {at: 1, params: {facts: [{label: 'Invitation note signed by member J. Park on Day 3', status: 'pending'}, {label: 'Partner-club card no. 0417 shown at the door', status: 'supplied'}]}, fn: "s.statuses.A === 'pending' && s.stateTag.includes('Route B') && !s.stateTag.includes('Route A')", label: 'a pending route is not listed as reaching the point (states as supplied)'},
    {at: 1, params: {textVisibility: 'none'}, fn: `s.relationsDrawn.every(p => p === 1) && ${ENDS} && s.ball > 0.9 && s.stateTag === null`, label: 'labels hidden: the same mechanism and states, no text'},
    {at: 0.5, fn: '!s.tracerOnText', label: 'the tracer runs on the links and hub points, never over printed text'},
  ],
});

/** In-page: render variants × ratios at time `at`, collecting visible text (px at 1080p) and semantics. */
async function collect(page, id, variants, at = 1) {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  return page.evaluate(async ([id, variants, at]) => {
    const def = await window.__lib.load(id);
    const shown = el => {
      for (let n = el; n && n.tagName !== 'svg'; n = n.parentNode) {
        const op = n.getAttribute && n.getAttribute('opacity');
        if (op !== null && op !== undefined && parseFloat(op) < 0.5) return false;
        if (n.getAttribute && n.getAttribute('display') === 'none') return false;
      }
      const b = el.getBBox();
      return b.width > 0 && b.height > 0;
    };
    const rows = [];
    let n = 0;
    for (const v of variants) {
      for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, instanceId: `c-${n++}`, params: v.params});
        await x.ready;
        x.seek(x.durationMs * at);
        const svg = x.element;
        const root = svg.getScreenCTM().inverse();
        const texts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]')).filter(shown).map(t => {
          const m = root.multiply(t.getScreenCTM());
          const px = parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
          const named = t.closest('[data-node]');
          const txt = [...t.childNodes].filter(c => c.nodeName !== 'title').map(c => c.textContent).join(' ');
          return {node: named ? named.getAttribute('data-node') : '', text: txt, px: Math.round(px * 10) / 10, truncated: Boolean(t.querySelector('title'))};
        });
        const st = x.getState({bounds: false});
        rows.push({name: v.name, ratio, texts, params: st.params, semantic: st.semantic});
        x.destroy();
        el.remove();
      }
    }
    return rows;
  }, [id, variants, at]);
}
const norm = s => String(s).toLowerCase().replace(/\s+/g, '');

// AUTHORING item 14: every supplied editable field is drawn and readable at the hold, never ellipsised.
test(`${ID}: every supplied field is drawn as text at the hold (presets × ratios), nothing truncated`, async ({page}) => {
  const rows = await collect(page, ID, [{name: 'default', params: {}}, ...presetsFor(ID)]);
  for (const r of rows) {
    const p = r.params;
    const hay = r.texts.map(t => norm(t.text)).join('|');
    const kinds = [...new Set(p.relationships.filter(rl => rl.from !== rl.to).map(rl => p.relationLabels[rl.kind] || rl.kind))];
    const fields = [p.rules.name, ...p.rules.conditions, ...p.facts.map(f => f.label), ...p.issues, ...p.assumptions, ...p.elements.map(e => e.label), ...kinds];
    expect.soft(fields.filter(f => f && !hay.includes(norm(f))), `${r.name} ${r.ratio}: supplied fields not visible at the hold`).toEqual([]);
    expect.soft(r.texts.filter(t => t.truncated || t.text.includes('…')).map(t => t.text), `${r.name} ${r.ratio}: truncated text`).toEqual([]);
    const key = p.locale === 'es' ? 'según lo aportado · sin conclusión' : 'as supplied · no conclusion drawn';
    expect.soft(hay.includes(norm(key)), `${r.name} ${r.ratio}: "${key}" key drawn`).toBe(true);
  }
});

// AUTHORING items 10 and 17: content ≥ 16 px (≥ 20 px in baseline presets except where noted), never smaller than captions.
test(`${ID}: text sizes — content ≥ 16 px, baseline ≥ 19 px, never smaller than captions`, async ({page}) => {
  const rows = await collect(page, ID, [{name: 'default', params: {}}, ...presetsFor(ID), {name: 'labels-key', params: {textVisibility: 'key'}}]);
  const isContent = n => /^(plate[AB]|card[AB]|rule-plaque-panel)-body$/.test(n);
  const isCaption = n => /^(lcap\d|cap-)/.test(n);
  for (const r of rows) {
    const content = r.texts.filter(t => isContent(t.node));
    const captions = r.texts.filter(t => isCaption(t.node));
    expect.soft(content.length, `${r.name} ${r.ratio}: content texts found`).toBeGreaterThan(3);
    const minContent = Math.min(...content.map(t => t.px));
    const maxCaption = captions.length ? Math.max(...captions.map(t => t.px)) : 0;
    // square frames of the baseline-es preset carry the longest Spanish texts: ≥ 19 px there, ≥ 20 px elsewhere
    // square frames trade text size for room to separate / gather the parts: ≥ 16 px there
    // round-2 finding: the baseline square is held to the same ≥ 19.5 px benchmark (long labels: ≥ 16 px)
    const floor = /baseline|default|labels-key/.test(r.name) ? 19.5 : 15.9;
    expect.soft(minContent, `${r.name} ${r.ratio}: smallest content text (px at 1080p)`).toBeGreaterThanOrEqual(floor);
    expect.soft(Math.min(...r.texts.map(t => t.px)), `${r.name} ${r.ratio}: smallest visible text`).toBeGreaterThanOrEqual(15.9);
    expect.soft(minContent + 0.05, `${r.name} ${r.ratio}: content never smaller than captions`).toBeGreaterThanOrEqual(maxCaption);
  }
});

// acceptanceCheck in every real ratio: links end on their parts while drawing, tracing and gathering; the
// magnifier comes back to the tray; parts never touch — labels on and off.
test(`${ID}: links attached and parts apart in every preset × ratio (labels on/off)`, async ({page}) => {
  const variants = [{name: 'default', params: {}}, ...presetsFor(ID)].flatMap(pr => [pr, {name: `${pr.name}-hidden`, params: {...pr.params, textVisibility: 'none'}}]);
  for (const at of [0.3, 0.5, 0.62, 0.77, 1]) {
    const rows = await collect(page, ID, variants, at);
    for (const r of rows) {
      const s = r.semantic;
      expect.soft(s.linkEnds.every(Boolean), `${r.name} ${r.ratio} t=${at}: every drawn link ends on its parts`).toBe(true);
      expect.soft(s.partsTouch, `${r.name} ${r.ratio} t=${at}: parts apart`).toBe(false);
      expect.soft(s.tracerOnText, `${r.name} ${r.ratio} t=${at}: tracer over printed text`).toBe(false);
      if (at === 1) expect.soft(s.lupaAtRest && s.text.captionMisses === 0, `${r.name} ${r.ratio}: magnifier on the tray, captions placed clear`).toBe(true);
      if (at === 1 && !r.name.endsWith('hidden')) {
        expect.soft(s.captionedLinks.gathered === s.captionedLinks.links && s.captionedLinks.spread === s.captionedLinks.links, `${r.name} ${r.ratio}: every link captioned`).toBe(true);
        expect.soft(s.leadersCross, `${r.name} ${r.ratio}: caption leaders cross (item 16)`).toBe(false);
        expect.soft(s.leaderOverLink, `${r.name} ${r.ratio}: a caption leader crosses another link (item 16)`).toBe(false);
        // round-3 (item 16): no two dotted leaders run side by side (which leader serves which link stays clear)
        expect.soft(s.leadersClose, `${r.name} ${r.ratio}: two caption leaders run close together`).toBe(false);
      }
      if (at === 1) {
        // the parts visibly gather: on average ≥ 25 px at 1080p, and at most one part (hemmed in) moves < 10 px
        const mv = Object.values(s.gatherMoves);
        expect.soft(mv.reduce((a, b) => a + b, 0) / mv.length, `${r.name} ${r.ratio}: mean gather move (px) ${JSON.stringify(s.gatherMoves)}`).toBeGreaterThanOrEqual(25);
        expect.soft(mv.filter(v => v < 10).length, `${r.name} ${r.ratio}: parts that barely move ${JSON.stringify(s.gatherMoves)}`).toBeLessThanOrEqual(1);
      }
    }
  }
});

// Status pills wrap between whole tokens: no word (e.g. "sent") is left alone on a line (reviewer finding).
test(`${ID}: status pills never orphan a single word`, async ({page}) => {
  const rows = await collect(page, ID, [{name: 'default', params: {}}, ...presetsFor(ID)], 1);
  for (const r of rows) {
    const pills = r.texts.filter(t => /-pill$/.test(t.node));
    expect.soft(pills.length, `${r.name} ${r.ratio}: pills found`).toBeGreaterThan(0);
  }
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const lines = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params}); await x.ready; x.seek(x.durationMs);
      for (const t of x.element.querySelectorAll('[data-node$="-pill"] tspan')) out.push({preset: pr.name, w, h, line: t.textContent.trim()});
      x.destroy(); el.remove();
    }
    return out;
  }, [ID, [{name: 'default', params: {}}, ...presetsFor(ID)]]);
  expect(lines.length).toBeGreaterThan(10);
  expect(lines.filter(l => !/\s/.test(l.line) && !l.line.includes('·') && lines.filter(q => q.preset === l.preset && q.w === l.w && q.h === l.h).length > 1)).toEqual([]);
});

// Fact cards and condition plates never leave a lone word on their last line (e.g. "Day / 3" in the square view).
test(`${ID}: card and plate bodies never end on a lone word`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bodies = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params}); await x.ready; x.seek(x.durationMs);
      for (const node of ['cardA', 'cardB', 'plateA', 'plateB']) {
        const t = x.element.querySelector(`[data-node="${node}-body"]`);
        if (!t) continue;
        const lines = [...t.querySelectorAll('tspan')].map(s => s.textContent.trim()).filter(Boolean);
        out.push({preset: pr.name, w, h, node, lines});
      }
      x.destroy(); el.remove();
    }
    return out;
  }, [ID, [{name: 'default', params: {}}, ...presetsFor(ID)]]);
  expect(bodies.length).toBeGreaterThan(40);
  expect(bodies.filter(b => b.lines.length > 1 && !/\s/.test(b.lines[b.lines.length - 1]))).toEqual([]);
});

// Round-2 finding: the magnifier never hides a caption while it lifts, holds over the focus and returns
// (1:1 at t=0.50 it hid Route B's "route (sequence)"; 9:16 at t=0.62 it covered "Junction · either route").
// Captions under its path move aside (or are lifted above it) and none is simply hidden.
test(`${ID}: the magnifier never covers a caption or printed text; the tracer never sits on a caption; no caption shows twice`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const bad = [];
    for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      for (let u = 0.3; u <= 0.8; u += 0.0025) {
        const s = def.evaluate({width: w, height: h, params: pr.params, timeMs: u * def.defaultParams.durationMs}).semantic;
        if (s.lensOverCaption) bad.push(`${pr.name} ${w}x${h} u=${u.toFixed(4)} caption`);
        // round-3: the tracer never sits on a caption (it runs under them and fades out near them)
        if (s.tracerOnCaption) bad.push(`${pr.name} ${w}x${h} u=${u.toFixed(4)} tracer on a caption`);
        // round-3: never two copies of a caption at once
        if (s.captionCopies > 1) bad.push(`${pr.name} ${w}x${h} u=${u.toFixed(4)} caption shown twice`);
        if (s.lensOverText) bad.push(`${pr.name} ${w}x${h} u=${u.toFixed(4)} card/plate/rule/notes text`);
      }
    }
    return {bad};
  }, [ID, [{name: 'default', params: {}}, ...presetsFor(ID)]]);
  expect(out.bad).toEqual([]);
});

// Round-2: the captions that move aside for the magnifier cross-fade; no two texts overlap at ANY time (the qa
// matrix only samples t = 0, 0.35, 0.7, 1 — this samples the whole timeline, every preset × ratio).
test(`${ID}: no text overlap anywhere on the timeline`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async ([id, presets]) => {
    const {layoutWarnings} = await import('/tests/harness/in-page.js');
    const def = await window.__lib.load(id);
    const bad = [];
    for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params}); await x.ready;
      for (let u = 0; u <= 1.0001; u += 0.01) {
        x.seek(u * x.durationMs);
        const lw = layoutWarnings(x.element, x, []);
        if (lw.overlaps.length) bad.push(`${pr.name} ${w}x${h} u=${u.toFixed(2)} ${JSON.stringify(lw.overlaps)}`);
      }
      x.destroy(); el.remove();
    }
    return bad;
  }, [ID, [{name: 'default', params: {}}, ...presetsFor(ID)]]);
  expect(out).toEqual([]);
});

// Round-3 (item 4): captions never move — no caption node is duplicated or swapped for a copy elsewhere, and
// each link's caption has at most one visible copy on screen at any time (DOM, whole timeline).
test(`${ID}: captions never duplicated while anything moves`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const bad = [];
    const op = el => { let o = 1; for (let n = el; n && n.tagName !== 'svg'; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
    for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params}); await x.ready;
      if (x.element.querySelector('[data-node^="acap"], [data-node="jalt"], [data-node="palt"]')) bad.push(`${pr.name} ${w}x${h}: moving caption copies exist`);
      for (let u = 0; u <= 1.0001; u += 0.005) {
        x.seek(u * x.durationMs);
        const per = {};
        for (const n of x.element.querySelectorAll('[data-node^="lcap"], [data-node^="gcap"]')) {
          const m = /^[lg]cap(\d+)$/.exec(n.getAttribute('data-node'));
          if (m && op(n) > 0.02) per[m[1]] = (per[m[1]] || 0) + 1;
        }
        for (const [k, v] of Object.entries(per)) if (v > 1) bad.push(`${pr.name} ${w}x${h} u=${u.toFixed(3)} link ${k}: ${v} copies`);
      }
      x.destroy(); el.remove();
    }
    return bad;
  }, [ID, [{name: 'default', params: {}}, ...presetsFor(ID)]]);
  expect(out).toEqual([]);
});
