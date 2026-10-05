// LAW-0104 — Condiciones alternativas · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the enlarged detail keeps its source coordinates (the lens copy is the same board geometry
// mapped from the source rectangle onto the lens window), the change is localized (only the datum, the valve
// ball and the route glow change; the capsule stays in the same tray) and seeking back restores the old datum.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';

const ID = 'LAW-0104';

contractSuite(ID, {
  continuity: ['cap', 'lensCap', 'slip'],
  // the lens copy's capsule is the context capsule (same coordinates) at every instant
  attach: [{from: 0, to: 1, a: 'cap', b: 'lensCap', tol: 0.01}],
  semantic: [
    {at: 0, fn: "s.datum === 'before' && s.lens === 0 && s.marker === 0 && s.struck === 0", label: 'build: before datum, no lens, no marker'},
    {at: 0.2, fn: "s.capState === 'in-tray' && s.ball > 0.9 && s.halo.A === 1 && s.halo.B === 0 && s.datum === 'before'", label: 'build: the state produced — capsule in the tray by Route A, ball against the B seat, tube A glowing'},
    {at: 0.44, fn: 's.lens === 1 && s.copyMapsSource && s.focusInSource && s.lensZoom > 1.5', label: 'isolate: the lens is a real enlarged copy of the focus region (source mapped exactly onto the window)'},
    {at: 0.44, fn: "s.datum === 'before' && s.ball > 0.9 && s.struck === 0 && !s.slipParked", label: 'isolate: nothing has changed yet'},
    {at: 0.555, fn: "s.slipParked && s.struck > 0 && s.datum === 'before' && s.ball > 0.9", label: 'substitute: the old value leaves first (parked and struck) before the new one appears (no garbled cross-fade)'},
    {at: 0.66, fn: "s.datum === 'after' && s.lens === 1", label: 'substitute: the new value appears while the lens holds'},
    {at: 0.74, fn: "s.ball < -0.9 && s.halo.B === 1 && s.halo.A === 0 && s.capState === 'in-tray'", label: 'substitute: only the dependent geometry follows (ball to the A seat, glow to tube B); the capsule stays in the tray'},
    {at: 1, fn: "s.lens === 0 && s.marker === 1 && s.struck === 1 && s.slipParked && s.datum === 'after' && s.datumValue.includes('Route B')", label: 'return: lens closed, Δ marker and the struck "before" slip remain'},
    {at: 0.3, fn: "s.datum === 'before' && s.datumValue.includes('Route A') && s.ball > 0.9", label: 'seeking back restores the old datum exactly'},
    {at: 1, params: {focusTarget: 'point'}, fn: 's.focus === "point" && s.copyMapsSource && s.focusInSource', label: 'the focus target is configurable (the tray)'},
    {at: 1, params: {beforeRoute: 'B', afterRoute: 'A'}, fn: 's.ball > 0.9 && s.halo.A === 1', label: 'the substitution can go the other way'},
    {at: 0.2, params: {beforeRoute: 'B', afterRoute: 'A'}, fn: 's.ball < -0.9 && s.halo.B === 1', label: 'before B: ball against the A seat, tube B glowing'},
    {at: 1, fn: 's.notes.issues === 1 && s.notes.key && s.notes.footHasAssumptions', label: 'issue, assumptions and the "as supplied · no conclusion drawn" key are drawn'},
    {at: 1, fn: 's.text.contentPx >= 20 && s.text.keyPx >= 18 && s.text.contentPx >= s.text.keyPx && s.text.keyPx >= s.text.captionPx', label: 'baseline text sizes'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.ball < -0.9 && s.halo.B === 1 && s.marker === 1', label: 'labels hidden: the same change reads (ball and glow)'},
    // reviewer fixes
    {at: 0.34, fn: 's.lens > 0 && !s.refUnderLens', label: 'while the lens is open no reference card under it shows (no faded fragments)'},
    {at: 0.79, fn: 's.refRegionFilled && !s.refUnderLens', label: 'return: the reference cards come back as the lens leaves them (the right half is never left empty, item 19)'},
    {at: 1, fn: 's.markerChipClear', label: 'the changed-datum chip sits clear of the A/B badges, bells, valve and tray'},
    {at: 0.9, fn: 's.refsOpacity === 1 && s.marker === 1', label: 'the complete final state is on screen ≥ 1 s before the end (item 19)'},
  ],
});

async function collect(page, id, variants, at = 1) {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  return page.evaluate(async ([id, variants, at]) => {
    const def = await window.__lib.load(id);
    const shown = el => {
      for (let n = el; n && n.tagName !== 'svg'; n = n.parentNode) {
        const op = n.getAttribute && n.getAttribute('opacity');
        if (op !== null && op !== undefined && parseFloat(op) < 0.5) return false;
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
          return {node: named ? named.getAttribute('data-node') : '', text: [...t.childNodes].filter(c => c.nodeName !== 'title').map(c => c.textContent).join(' '), px: Math.round(px * 10) / 10, truncated: Boolean(t.querySelector('title'))};
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

test(`${ID}: every supplied field is drawn as text at the hold (presets × ratios), nothing truncated`, async ({page}) => {
  const rows = await collect(page, ID, [{name: 'default', params: {}}, ...presetsFor(ID)]);
  for (const r of rows) {
    const p = r.params;
    const hay = r.texts.map(t => norm(t.text)).join('|');
    const fields = [p.rules.name, ...p.rules.conditions, ...p.facts.map(f => f.label), ...p.issues, ...p.assumptions, p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker];
    expect.soft(fields.filter(f => f && !hay.includes(norm(f))), `${r.name} ${r.ratio}: supplied fields not visible`).toEqual([]);
    expect.soft(r.texts.filter(t => t.truncated || t.text.includes('…')).map(t => t.text), `${r.name} ${r.ratio}: truncated`).toEqual([]);
    const key = p.locale === 'es' ? 'según lo aportado · sin conclusión' : 'as supplied · no conclusion drawn';
    expect.soft(hay.includes(norm(key)), `${r.name} ${r.ratio}: key drawn`).toBe(true);
  }
});

test(`${ID}: text sizes — content ≥ 16 px, baseline ≥ 20 px, never smaller than captions`, async ({page}) => {
  const rows = await collect(page, ID, [{name: 'default', params: {}}, ...presetsFor(ID), {name: 'labels-key', params: {textVisibility: 'key'}}]);
  const isContent = n => /^(routeA|routeB|rule-plaque-panel)-body$|^(val-new-text|slip-text)$/.test(n);
  const isCaption = n => /^ctx-caption$/.test(n);
  for (const r of rows) {
    const content = r.texts.filter(t => isContent(t.node));
    const captions = r.texts.filter(t => isCaption(t.node));
    expect.soft(content.length, `${r.name} ${r.ratio}: content texts found`).toBeGreaterThan(3);
    const minContent = Math.min(...content.map(t => t.px));
    const maxCaption = captions.length ? Math.max(...captions.map(t => t.px)) : 0;
    const floor = /baseline|default|labels-key/.test(r.name) ? 19.9 : 15.9;
    expect.soft(minContent, `${r.name} ${r.ratio}: smallest content text`).toBeGreaterThanOrEqual(floor);
    expect.soft(Math.min(...r.texts.map(t => t.px)), `${r.name} ${r.ratio}: smallest visible text`).toBeGreaterThanOrEqual(15.9);
    expect.soft(minContent + 0.05, `${r.name} ${r.ratio}: content never smaller than captions`).toBeGreaterThanOrEqual(maxCaption);
  }
});

// Seeking back restores the old datum exactly, in every ratio and preset (render state identical to a fresh seek).
test(`${ID}: seek back restores the old datum (state identical to a fresh instance)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const bad = [];
    let n = 0;
    for (const pr of presets) {
      for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
        const mk = () => { const el = document.createElement('div'); document.getElementById('slots').appendChild(el); return def.create(el, {width: w, height: h, instanceId: `sb-${n++}`, params: pr.params}); };
        const a = mk(), b = mk();
        await Promise.all([a.ready, b.ready]);
        a.seek(a.durationMs);
        a.seek(a.durationMs * 0.3);
        b.seek(b.durationMs * 0.3);
        const sa = JSON.stringify(a.getState({bounds: false}).nodes), sb = JSON.stringify(b.getState({bounds: false}).nodes);
        if (sa !== sb || a.getState({bounds: false}).semantic.datum !== 'before') bad.push(`${pr.name} ${w}x${h}`);
        a.destroy(); b.destroy();
      }
    }
    return bad;
  }, [ID, presets]);
  expect(out).toEqual([]);
});

// Reviewer fixes, in every preset × ratio: the lens never passes over the datum card (open, hold, close); the
// reference cards are either fully shown or fully hidden; tall frames keep the board at full width; the final
// state is complete and unchanged from t = 0.87 (≥ 1 s at 8 s) to the end.
test(`${ID}: lens clear of the datum card, cards never half-faded, large board, held final state`, async ({page}) => {
  const times = [0.2, 0.22, 0.24, 0.25, 0.26, 0.28, 0.3, 0.34, 0.4, 0.5, 0.6, 0.7, 0.73, 0.74, 0.75, 0.76, 0.77, 0.78, 0.79, 0.8, 0.81, 0.82, 0.84, 0.87, 1];
  const rows = await collect2(page, ID, [{name: 'default', params: {}}, ...presetsFor(ID)], times);
  for (const r of rows) {
    const s = r.semantic;
    expect.soft(s.lensOverDatum, `${r.name} ${r.ratio} t=${r.at}: lens over the datum card`).toBe(false);
    expect.soft(s.refUnderLens, `${r.name} ${r.ratio} t=${r.at}: a reference card shows under the lens`).toBe(false);
    if (r.ratio === '9:16') expect.soft(s.boardFrac, `${r.name} 9:16: board width / frame width`).toBeGreaterThanOrEqual(0.8);
    // round-2 finding: the context board never stands alone with the reference region empty (open and return)
    expect.soft(s.refRegionFilled, `${r.name} ${r.ratio} t=${r.at}: reference region occupied by the lens or the cards`).toBe(true);
    if (r.at === 1) expect.soft(s.markerChipClear, `${r.name} ${r.ratio}: changed-datum chip clear of the badges and board parts`).toBe(true);
  }
  const at = (n, ra, t) => rows.find(q => q.name === n && q.ratio === ra && q.at === t).semantic;
  for (const r of rows.filter(q => q.at === 1)) {
    const a = at(r.name, r.ratio, 0.87), b = r.semantic;
    expect.soft(JSON.stringify([a.ball, a.halo, a.marker, a.refsOpacity, a.datum, a.lens, a.struck]), `${r.name} ${r.ratio}: final state complete by t=0.87`).toBe(JSON.stringify([b.ball, b.halo, b.marker, b.refsOpacity, b.datum, b.lens, b.struck]));
  }
});

async function collect2(page, id, variants, times) {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  return page.evaluate(async ([id, variants, times]) => {
    const def = await window.__lib.load(id);
    const rows = [];
    let n = 0;
    for (const v of variants) {
      for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, instanceId: `h-${n++}`, params: v.params});
        await x.ready;
        for (const at of times) { x.seek(x.durationMs * at); rows.push({name: v.name, ratio, at, semantic: x.getState({bounds: false}).semantic}); }
        x.destroy();
        el.remove();
      }
    }
    return rows;
  }, [id, variants, times]);
}

// Round-2 finding: the changed-datum marker is the shared neutral changedMarker() (white Δ on accent2), with no red
// ring or red filled triangle anywhere in the marker group.
test(`${ID}: changed-datum marker is the shared neutral Δ marker`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const res = [];
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h}); await x.ready; x.seek(x.durationMs);
      const m = x.element.querySelector('[data-node="marker"]');
      const d = x.element.querySelector('[data-node="marker-delta"]');
      const disc = d && d.querySelector('circle');
      const fills = m ? [...m.querySelectorAll('circle, path, polygon')].map(e => (e.getAttribute('fill') || '').toLowerCase()) : [];
      const strokes = m ? [...m.querySelectorAll('circle, path, line')].map(e => (e.getAttribute('stroke') || '').toLowerCase()) : [];
      res.push({w, h, hasDelta: Boolean(d), disc: disc && disc.getAttribute('fill'), fills, strokes});
      x.destroy(); el.remove();
    }
    return res;
  }, ID);
  // default theme: accent2 = #2f6690 (neutral blue), accent = #c8553d (the red the reviewer flagged)
  for (const r of out) {
    expect.soft(r.hasDelta, `${r.w}x${r.h}: changedMarker present`).toBe(true);
    expect.soft(r.disc, `${r.w}x${r.h}: Δ disc on accent2`).toBe('#2f6690');
    expect.soft([...r.fills, ...r.strokes].filter(c => c === '#c8553d'), `${r.w}x${r.h}: no red accent in the marker`).toEqual([]);
  }
});

// Round-2: no two texts overlap at ANY time (the qa matrix samples only t = 0, 0.35, 0.7, 1), every preset × ratio.
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
