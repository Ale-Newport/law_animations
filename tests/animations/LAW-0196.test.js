// LAW-0196 — Consulta de expediente por auxiliar · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens copy is the same stage drawn at the
// context's coordinates and enlarged from its source crop), the change is local (only the inspected piece's
// supplied position, its value tag and the tag's link change), and seeking back restores the previous datum.
// Windows (LAW-0196.js W): caption 0.04–0.12 · the full-size context yields room 0.16–0.22 · lens opens 0.22–0.38 ·
// strike 0.46–0.50 · old value greys 0.51–0.55 · piece moves in the lens 0.55–0.63 (sideways past the plates,
// never over another compartment) · new value 0.63–0.66 (held until the close starts at 0.73) · context: strike
// 0.66–0.68, move 0.66–0.705, new value 0.705–0.72 · lens closes 0.73–0.79 · context back to full size 0.79–0.83 ·
// Δ marker 0.83–0.86.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0196';

contractSuite(ID, {
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextDatum === 'before' && !s.markerVisible", label: 'context: the old datum, no lens, no marker'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.datum === 'before' && s.sourceHoldsDetail && s.zoom >= 1.5", label: 'isolate: a real enlarged copy (≥ 1.5×) of the tabs, plates and value tag'},
    {at: 0.52, fn: "s.datum === 'changing' && s.contextDatum === 'before' && s.oldStruck > 0.9", label: 'substitute inside the lens only: the old value struck, the context untouched'},
    {at: 0.7, fn: "s.datum === 'after' && s.lensPieceSlot === s.after && s.lensOpen === 1", label: 'the lens shows the new value and the dependent geometry (the piece in the supplied slot)'},
    {at: 0.725, fn: "s.contextDatum === 'after' && s.contextPieceSlot === s.after && s.lensOpen === 1", label: 'the context matches the lens before it closes'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextDatum === 'after' && s.markerVisible && s.oldValueShown === 1 && s.allReached && s.layoutFits", label: 'return: marker shown, the old value kept (struck), layout fits'},
    {at: 0.3, fn: "s.datum === 'before' && s.contextDatum === 'before' && s.contextPieceSlot === s.before", label: 'seeking back restores the old datum exactly'},
    {at: 0.7, params: {textVisibility: 'none'}, fn: "s.lensPieceSlot === s.after && s.lensOpen === 1", label: 'labels hidden: the same isolation and change'},
    {at: 1, params: {detailGeometry: {zoom: 2, placement: 'auto', beforeSlot: 3, afterSlot: 1}}, fn: 's.after === 0 && s.contextPieceSlot === 0', label: 'the geometry follows the SUPPLIED slot numbers, never the wording'},
  ],
});

ratioChecks(ID, 'lens scale, people, marker', [
  {at: [0.4, 0.5, 0.6, 0.7], fn: 's.zoom >= 1.5 - 1e-9 && s.lensOpen === 1 && s.sourceHoldsDetail', label: 'lens scale / context scale ≥ 1.5 and its source holds the detail'},
  {at: times(0.2, 0.82, 0.01), fn: 's.lensClearOfPeople', label: 'the lens window never covers a head or the upper body'},
  {at: [1], fn: 's.markerVisible && s.markerClearOfPeople && s.layoutFits', label: 'hold: Δ marker clear of the people; layout fits'},
]);

suppliedTextSuite(ID, {
  fields: 'return [p.actors[0].name, ...p.props.pieces.map(q => q.title), p.props.fileLabel, p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker, ...p.relationships.map(r => r.label)]',
  content: 'return [...p.props.pieces.map(q => q.title), p.beforeValue, p.afterValue]',
  captions: 'return ["as supplied", "según lo aportado"]',
});

// Rendered: while the lens is open no text line of the copy is cut by the rim (each field wholly in or out), and
// no two visible copies of the same text overlap (the opaque window hides its source).
test.describe(`${ID} lens (rendered)`, () => {
  test(`${ID}: no lens-copy text crosses the rim; no double image`, async ({page}) => {
    test.setTimeout(240000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
        for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: pr.params});
          await x.ready;
          const svg = x.element;
          const node = n => svg.querySelector(`[data-node="${n}"]`);
          const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
          let texts = 0;
          for (let u = 0.22; u <= 0.79 + 1e-9; u += 0.01) {
            x.seek(u * x.durationMs);
            const win = node('lz-win');
            if (!win || eff(win) < 0.05) continue;
            const W = node('lz-border').getBoundingClientRect();
            const inLens = [];
            for (const t of node('lz-content').querySelectorAll('text')) {
              if (eff(t) < 0.05 || !(t.textContent || '').trim()) continue;
              const spans = [...t.querySelectorAll('tspan')];
              const lines = spans.length ? spans : [t];
              const vis = lines.filter(q => { const b = q.getBoundingClientRect(); return b.width > 0.5 && b.left < W.right && b.right > W.left && b.top < W.bottom && b.bottom > W.top; });
              for (const q of vis) {
                texts++;
                const b = q.getBoundingClientRect();
                if (b.left < W.left - 1 || b.right > W.right + 1 || b.top < W.top - 1 || b.bottom > W.bottom + 1) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: "${q.textContent.slice(0, 24)}" cut by the rim`);
              }
              if (vis.length && vis.length !== lines.length) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: field "${t.textContent.slice(0, 24)}" only partly in the lens`);
              if (vis.length) { const b0 = t.getBoundingClientRect(); inLens.push({txt: t.textContent.trim(), b: {left: Math.max(b0.left, W.left), right: Math.min(b0.right, W.right), top: Math.max(b0.top, W.top), bottom: Math.min(b0.bottom, W.bottom)}}); }
            }
            // double image: a visible context text with the same content overlapping a lens text, outside the window
            for (const t of svg.querySelectorAll('text')) {
              if (t.closest('[data-node="lz-content"]') || eff(t) < 0.05) continue;
              const b = t.getBoundingClientRect();
              const hidden = b.left >= W.left && b.right <= W.right && b.top >= W.top && b.bottom <= W.bottom;
              if (hidden) continue;
              // only the part of a context text outside the opaque window is visible
              const outside = q => !(q.b.left >= W.left && q.b.right <= W.right && q.b.top >= W.top && q.b.bottom <= W.bottom);
              void outside;
              for (const q of inLens) if (q.txt === t.textContent.trim() && b.left < q.b.right && b.right > q.b.left && b.top < q.b.bottom && b.bottom > q.b.top && eff(node('lz-win')) < 0.99) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: double image of "${q.txt.slice(0, 20)}"`);
            }
          }
          if (!pr.params.textVisibility && !texts) out.push(`${pr.name} ${ratio}: no lens text found (vacuous)`);
          x.destroy();
          el.remove();
        }
      }
      return [...new Set(out)].slice(0, 40);
    }, [ID, presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

// Review round 1: only the supplied datum changes. Every piece of the file is drawn, with its title readable (not
// covered by another piece), before the change and at the hold; the piece numbers never change.
test.describe(`${ID} identities`, () => {
  test(`${ID}: every piece stays visible; only the inspected position changes`, async ({page}) => {
    test.setTimeout(240000);
    await page.setViewportSize({width: 2000, height: 2000});
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
        for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
          const el = document.createElement('div');
          el.style.cssText = 'position:fixed;left:0;top:0;z-index:9';
          document.body.appendChild(el);
          const x = def.create(el, {width: w, height: h, params: pr.params});
          await x.ready;
          const svg = x.element;
          const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
          const params = x.getState({bounds: false}).params;
          const titles = params.props.pieces.map(q => q.title.replace(/\s+/g, ''));
          const nums0 = JSON.stringify(x.getState({bounds: false}).semantic.pieceNumbers);
          for (const u of [0, 1]) {
            x.seek(u * x.durationMs);
            if (JSON.stringify(x.getState({bounds: false}).semantic.pieceNumbers) !== nums0) out.push(`${pr.name} ${ratio}: piece numbers changed`);
            const texts = [...svg.querySelectorAll('[data-node^="st-p"] text')].filter(t => eff(t) > 0.05);
            for (const tt of titles) {
              const t = texts.find(q => q.textContent.replace(/\s+/g, '') === tt);
              if (!t) { out.push(`${pr.name} ${ratio} u=${u}: "${tt}" not drawn`); continue; }
              const spans = [...t.querySelectorAll('tspan')];
              // covered = an opaque shape drawn later (not part of this piece) over the centre of a title line
              const card = t.closest('[data-node^="st-p"]');
              const shapes = [...svg.querySelectorAll('path, rect')].filter(e => !e.closest('defs') && !card.contains(e) && (e.getAttribute('fill') || '') !== 'none' && eff(e) > 0.5 && (t.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING));
              for (const q of (spans.length ? spans : [t])) {
                const b = q.getBoundingClientRect();
                const c = {x: b.left + b.width / 2, y: b.top + b.height / 2};
                if (shapes.some(e => { const r = e.getBoundingClientRect(); return c.x > r.left && c.x < r.right && c.y > r.top && c.y < r.bottom; })) out.push(`${pr.name} ${ratio} u=${u}: "${tt}" covered`);
              }
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
});

// Coordinator decision 2026-09-26: visible text is never below 16 px at 1080p, at every sampled time (while the
// context yields room for the lens too), not only at the hold.
test.describe(`${ID} text size over time`, () => {
  test(`${ID}: every visible text ≥ 16 px at every sampled u`, async ({page}) => {
    test.setTimeout(300000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
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
              if (pxs < 16 - 0.05) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: "${t.textContent.slice(0, 20)}" ${pxs.toFixed(1)} px`);
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
});
