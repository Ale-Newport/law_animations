// LAW-0112 — Premisa oculta · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates (the lens starts as a scale-1 copy exactly on the card
// in the context thumbnail), the change is localized (one datum, then only the premise's supplied status: its look,
// hinges and level) and seeking back to earlier times restores exactly the previous datum and status.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {motifDomChecks} from './premisa-oculta-checks.js';

const ID = 'LAW-0112';
const BEFORE = 'Whoever holds the shed key locked the shed last';
const AFTER = 'Only the person with the key can lock the shed';
const alt = presetsFor(ID).find(p => p.name === 'contrast-or-alternative').params;

contractSuite(ID, {
  continuity: ['lens', 'slip', 'tagSlot', 'fact'],
  attach: [
    // the picked-up slip sits exactly on the old text inside the open lens until it is pulled out
    {from: 0.461, to: 0.499, a: 'slip', b: 'slipHome', tol: 0.6},
    // at the end the slip rests inside the tag, which rides the context as it grows back
    {from: 0.831, to: 1, a: 'slip', b: 'tagSlot', tol: 0.6},
  ],
  semantic: [
    {at: 0.02, fn: 's.gapOpen === 0 && s.hingeK === -1', label: 'build starts with the gap closed (the card is covered)'},
    {at: 0.165, fn: `s.contextFull && s.gapOpen === 1 && s.datum === 'before' && s.datumValue === ${JSON.stringify(BEFORE)} && s.premiseStatus === 'unstated' && s.hingeK === -1 && !s.lensVisible`, label: 'build: the gap is open and reveals the card as supplied before (left unstated: hinges folded)'},
    {at: 0.185, fn: 's.contextFull && s.lensVisible && s.lensAtSource && s.lensScale === 1 && s.sourceOnCard', label: 'isolate: the lens starts as a scale-1 copy exactly on the card (source coordinates kept)'},
    ...[0.22, 0.25, 0.28].map(at => ({at, fn: '!s.contextFull && !s.contextThumb && s.lensOpen > 0 && s.lensOpen < 1 && s.sourceOnCard', label: `isolate: the lens lifts off while the context shrinks, its source following the card (no empty frame) @${at}`})),
    ...[0.77, 0.79].map(at => ({at, fn: '!s.contextFull && !s.contextThumb && s.lensOpen > 0 && s.lensOpen < 1 && s.sourceOnCard', label: `return: the lens closes onto its card while the context grows back @${at}`})),
    {at: 0.44, fn: "s.lensScale >= 1.5 && s.dim > 0 && s.datum === 'before' && s.oldValueShownIn === 'card' && s.premiseStatus === 'unstated'", label: 'isolate: the card is enlarged, the rest dims; nothing has changed yet'},
    {at: 0.6, fn: "s.slipVisible && s.slipOutOfLens && s.oldValueShownIn === 'slip' && s.hingeK === -1 && s.premiseLook === 'unstated'", label: 'substitute: the old value leaves the lens as a slip (kept in view); the dependent state has not changed yet'},
    {at: 0.66, fn: `s.datum === 'after' && s.datumValue === ${JSON.stringify(AFTER)} && s.slipStruck`, label: 'substitute: the supplied new value is on the card; the old one is struck on its slip'},
    {at: 0.75, fn: "s.dependentChanged && s.premiseStatus === 'stated' && s.premiseLook === 'stated' && s.hingeK === 1 && s.lift === 1", label: 'only then the dependent part changes to the status supplied for after (printed, hinges latched, flush)'},
    {at: 0.66, fn: "s.premiseLook === 'stated'", label: 'the card takes one look (the after status) when the change starts, never a blend'},
    ...[0.19, 0.2, 0.21, 0.8, 0.805, 0.81].map(at => ({at, fn: '!s.lensOverCard || s.cardTextHiddenUnderLens', label: `lens over its own card: the card's context text waits (no doubled words) @${at}`})),
    ...[0.56, 0.6, 0.65, 0.7, 0.74].map(at => ({at, fn: 's.slipVisible && s.slipOutOfLens && !s.slipUnderLens', label: `substitute: the pulled-out slip lies outside the lens @${at}`})),
    ...[0.745, 0.76, 0.78, 0.8, 0.82].map(at => ({at, fn: 's.slipVisible && s.slipUnderLens', label: `return: the closing lens passes in front of the struck slip (drawn under it, no mixed text) @${at}`})),
    {at: 0.83, fn: "s.slipInTag && s.oldValueShownIn === 'tag' && s.contextFull", label: 'return: the slip reaches its tag slot once the lens has closed'},
    {at: 0.9, fn: 's.contextFull && s.markerVisible && s.pinVisible && s.notesVisible', label: 'the complete final state is reached > 1 s before the end (item 19)'},
    ...[0.806, 0.815, 0.82, 0.825, 0.835].map(at => ({at, fn: 's.tagOpacity === 0 || s.leaderDrawn > 0', label: `return: the tag is joined by its growing leader whenever it shows @${at}`})),
    {at: 1, fn: "s.contextFull && !s.lensVisible && s.markerVisible && s.pinVisible && s.slipInTag && s.slipStruck && s.datum === 'after' && s.notesVisible && s.notes.some(n => n.includes('Who else could open the shed')) && s.notes.some(n => n.includes('single key')) && s.notes.some(n => n.includes('no conclusion drawn'))", label: 'hold: full context with pin and tag holding the struck old value; issue, assumption and key drawn'},
    {at: 0.12, fn: "s.notesVisible && s.notes.length === 3", label: 'build: the issue, assumption and key are drawn in the full view'},
    {at: 0.3, fn: `s.datum === 'before' && s.datumValue === ${JSON.stringify(BEFORE)} && s.premiseStatus === 'unstated' && s.hingeK === -1 && !s.slipVisible`, label: 'seeking back (after the end) restores exactly the old datum and status'},
    {at: 0.74, params: {textVisibility: 'none'}, fn: "s.datum === 'after' && s.hingeK === 1 && s.slipVisible && s.contextThumb", label: 'labels hidden: the same slip, substitution and dependent change'},
    {at: 1, params: {textVisibility: 'all', afterStatus: 'unstated'}, fn: "s.premiseStatus === 'unstated' && s.hingeK === -1 && s.lift === 0", label: 'status supplied as unchanged after: the hinges stay folded (nothing inferred from the new text)'},
    {at: 0.75, params: alt, fn: "s.focusTarget === 'conclusion' && s.datumValue === 'The umbrella is still waiting at the desk' && s.statusBefore === 'stated' && s.premiseStatus === 'unstated' && s.hingeK === -1", label: 'alternative: the conclusion text is replaced; the premise supplied as stated before, unstated after (hinges fold back)'},
    {at: 0.19, params: alt, fn: "s.premiseStatus === 'stated' && s.hingeK === 1 && s.lift === 1", label: 'alternative: before the change the stated card is latched and flush'},
    {at: 1, fn: 's.bodyPx1080 >= 20 && s.notePx1080 >= 20', label: 'baseline 16:9: card text and notes >= 20 px'},
  ],
});

// Rendered checks at the hold for every preset × real ratio (labels shown and hidden).
test(`${ID}: supplied fields drawn, readable, not truncated (presets × ratios × labels)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const rows = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const norm = s => String(s).toLowerCase().replace(/\s+/g, '');
    const shown = el => {
      for (let n = el; n && n.tagName !== 'svg'; n = n.parentNode) {
        const op = n.getAttribute && n.getAttribute('opacity');
        if (op !== null && op !== undefined && parseFloat(op) < 0.5) return false;
        if (n.getAttribute && n.getAttribute('display') === 'none') return false;
      }
      const b = el.getBBox();
      return b.width > 0 && b.height > 0;
    };
    const out = [];
    for (const pr of presets) {
      for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        for (const tv of ['all', 'none']) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
          await x.ready;
          x.seek(x.durationMs);
          const p = x.getState({bounds: false}).params;
          const svg = x.element;
          const texts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]')).filter(shown);
          const txt = t => [...t.childNodes].filter(c => c.nodeName !== 'title').map(c => c.textContent).join(' ');
          const hay = texts.map(t => norm(txt(t))).join('|');
          const px = t => {
            const m = svg.getScreenCTM().inverse().multiply(t.getScreenCTM());
            return parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
          };
          const role = t => (t.closest('[data-role]') ? t.closest('[data-role]').getAttribute('data-role') : 'none');
          const content = texts.filter(t => role(t) === 'content').map(px);
          const caption = texts.filter(t => role(t) === 'caption').map(px);
          const focusText = {premise: p.rules, fact: p.facts, conclusion: p.conclusion};
          delete focusText[p.focusTarget];
          const fields = tv === 'all' ? [...Object.values(focusText), p.beforeValue, p.afterValue, ...p.issues, ...p.assumptions, p.contextLabels.context, p.contextLabels.marker] : [];
          out.push({
            preset: pr.name, ratio, tv,
            missing: fields.filter(f => f && !hay.includes(norm(f))),
            truncated: texts.filter(t => t.querySelector('title') || txt(t).includes('…')).map(t => txt(t).slice(0, 40)),
            unroled: texts.filter(t => role(t) === 'none').map(t => txt(t).slice(0, 30)),
            note: tv === 'none' || hay.includes(norm('no conclusion drawn')) || hay.includes(norm('sin conclusión')),
            minContent: content.length ? Math.min(...content) : null,
            maxCaption: caption.length ? Math.max(...caption) : 0,
            visibleTexts: texts.length,
          });
          x.destroy();
          el.remove();
        }
      }
    }
    return out;
  }, [ID, presets]);
  for (const r of rows) {
    const tag = `${r.preset} ${r.ratio} labels=${r.tv}`;
    expect.soft(r.missing, `${tag}: supplied fields not drawn at the hold`).toEqual([]);
    expect.soft(r.truncated, `${tag}: ellipsised text at the hold`).toEqual([]);
    expect.soft(r.unroled, `${tag}: text without a content/caption role`).toEqual([]);
    expect.soft(r.note, `${tag}: "as supplied · no conclusion drawn" key at the hold`).toBe(true);
    if (r.tv === 'none') expect.soft(r.visibleTexts, `${tag}: no visible text with labels hidden`).toBe(0);
    if (r.tv === 'all') {
      const floor = /baseline|default/.test(r.preset) ? 20 : 16;
      expect.soft(r.minContent, `${tag}: supplied/key text >= ${floor} px at 1080p`).toBeGreaterThanOrEqual(floor);
      expect.soft(r.minContent + 0.5, `${tag}: supplied/key text never smaller than the generic captions`).toBeGreaterThanOrEqual(r.maxCaption);
    }
  }
});

// Shared rendered-text audit (tests/harness/supplied-text.js) at the hold, and the motif DOM checks: text inside
// chips, no split words (on the card, in the lens, on the slip, in the tag), and the pin never on text.
suppliedTextSuite(ID, {
  fields: 'const f = {premise: p.rules, fact: p.facts, conclusion: p.conclusion}; delete f[p.focusTarget]; return [...Object.values(f), p.beforeValue, p.afterValue, ...p.issues, ...p.assumptions, p.contextLabels.context, p.contextLabels.marker]',
  // card kind labels (generic captions): only the fact label, the others are substrings of supplied marker/context texts
  captions: "return [p.locale === 'es' ? 'HECHO' : 'FACT']",
});
motifDomChecks(ID, {at: [0.42, 0.66, 1], clearOfText: ['pin-head', 'pin-lead']});

// Round-2 checks (reviewer items 1–4): neutral changed-datum marker, no near-empty frame, supplied zoom honoured,
// the magnifier handle never lying on text while the lens lifts off / closes onto its card.
const RATIOS = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];
const ALL = () => [{name: 'default', params: {}}, ...presetsFor(ID)];

test(`${ID}: changed-datum marker in the neutral accent (white Δ on the accent2 disc; no alarm colour on pin, lead or tag)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const rows = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      x.seek(x.durationMs);
      const s = x.getState({bounds: false}).semantic;
      const svg = x.element;
      const norm = c => String(c || '').trim().toLowerCase();
      const alarm = norm(s.alarmColor);
      const disc = svg.querySelector('[data-node="pin-disc"]');
      const glyph = disc && disc.nextElementSibling;
      const painted = [...svg.querySelectorAll('[data-node="pin"] *, [data-node="tag"] *')]
        .flatMap(e => [e.getAttribute('fill'), e.getAttribute('stroke')]).map(norm).filter(Boolean);
      out.push({
        tag: `${pr.name} ${ratio}`,
        disc: disc ? norm(disc.getAttribute('fill')) : null,
        accent2: norm(s.markerColors[0]),
        glyph: glyph ? norm(glyph.getAttribute('stroke')) : null,
        alarmUsed: painted.filter(c => c === alarm),
        lead: norm(svg.querySelector('[data-node="pin-lead"]').getAttribute('stroke')),
        frame: norm(svg.querySelector('[data-node="tag-frame"]').getAttribute('stroke')),
        alarm,
      });
      x.destroy();
      el.remove();
    }
    return out;
  }, [ID, ALL(), RATIOS]);
  for (const r of rows) {
    expect.soft(r.disc, `${r.tag}: pin disc is the accent2 blue`).toBe(r.accent2);
    expect.soft(r.glyph, `${r.tag}: the Δ glyph is white`).toBe('#ffffff');
    expect.soft(r.alarmUsed, `${r.tag}: no alarm (accent) colour anywhere in the pin or the tag`).toEqual([]);
    expect.soft(r.lead, `${r.tag}: leader not in the alarm colour`).not.toBe(r.alarm);
    expect.soft(r.frame, `${r.tag}: tag frame not in the alarm colour`).not.toBe(r.alarm);
  }
});

test(`${ID}: no near-empty frame — the scene spans >= 40 % of the room in both axes (or the full room in one) at every frame; supplied zoom honoured`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const rows = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) for (const [ratio, w, h] of ratios) for (const tv of ['all', 'none']) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const supplied = x.getState({bounds: false}).params.detailGeometry.zoom;
      const low = [];
      let minCover = 1;
      // from 0.03 on: the first ~250 ms are the fade-in of the notes around the (full-size) walk
      for (let k = 3; k <= 100; k++) {
        const u = k / 100;
        x.seek(u * x.durationMs);
        const f = x.getState({bounds: false}).semantic.sceneFill;
        const c = Math.min(f.w, f.h);
        minCover = Math.min(minCover, c);
        // a scene spanning the whole room in one axis is as large as its aspect allows (e.g. the full-size walk
        // of a text-dense set in a square box, labels hidden); anything else must span >= 40 % in both axes
        if (c < 0.4 && Math.max(f.w, f.h) < 0.95) low.push(`${u}:${f.w}x${f.h}`);
      }
      x.seek(0.45 * x.durationMs);
      const s = x.getState({bounds: false}).semantic;
      out.push({tag: `${pr.name} ${ratio} labels=${tv}`, low, minCover, supplied, zoom: s.zoom, lensScale: s.lensScale, arrangement: s.arrangement});
      x.destroy();
      el.remove();
    }
    return out;
  }, [ID, ALL(), RATIOS]);
  for (const r of rows) {
    expect.soft(r.low, `${r.tag}: frames where the scene spans < 40 % of the room (min ${r.minCover})`).toEqual([]);
    expect.soft(r.zoom, `${r.tag}: layout zoom >= supplied ${r.supplied} (${r.arrangement})`).toBeGreaterThanOrEqual(r.supplied - 1e-3);
    expect.soft(r.lensScale, `${r.tag}: measured lens ÷ source >= supplied ${r.supplied}`).toBeGreaterThanOrEqual(r.supplied - 0.01);
  }
});

test(`${ID}: the magnifier handle never lies on text while the lens lifts off or closes onto its card`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const times = [];
  for (let u = 0.17; u <= 0.335; u += 0.01) times.push(+u.toFixed(3));
  for (let u = 0.745; u <= 0.835; u += 0.005) times.push(+u.toFixed(3));
  const rows = await page.evaluate(async ([id, presets, ratios, times]) => {
    const def = await window.__lib.load(id);
    const shown = el => {
      for (let n = el; n && n.tagName !== 'svg'; n = n.parentNode) {
        const op = n.getAttribute && n.getAttribute('opacity');
        if (op !== null && op !== undefined && parseFloat(op) < 0.5) return false;
      }
      const b = el.getBBox();
      return b.width > 0 && b.height > 0;
    };
    const boxOf = (svg, el) => {
      const bb = el.getBBox();
      const m = svg.getScreenCTM().inverse().multiply(el.getScreenCTM());
      const pts = [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]].map(([px, py]) => [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f]);
      const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
      return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
    };
    const inter = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const out = [];
    for (const pr of presets) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      const hits = [];
      for (const u of times) {
        x.seek(u * x.durationMs);
        const svg = x.element;
        const texts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]')).filter(shown);
        for (const nm of ['bar-knob', 'bar-ferrule']) {
          const hEl = svg.querySelector(`[data-node="${nm}"]`);
          if (!hEl || !shown(hEl)) continue;
          const hb = boxOf(svg, hEl);
          const t = texts.find(tx => inter(hb, boxOf(svg, tx)));
          if (t) hits.push(`${u} ${nm}→${t.textContent.slice(0, 20)}`);
        }
      }
      out.push({tag: `${pr.name} ${ratio}`, hits});
      x.destroy();
      el.remove();
    }
    return out;
  }, [ID, ALL(), RATIOS, times]);
  for (const r of rows) expect.soft(r.hits, `${r.tag}: handle on text`).toEqual([]);
});
