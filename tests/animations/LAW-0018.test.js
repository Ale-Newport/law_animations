// LAW-0018 — Ocultación de datos · mechanism. Contract battery + ID-specific checks.
// Acceptance (brief): every connector ends at its element, the order does not
// change when seeking, and a relation is never drawn as causality by default.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';

const stress = presetsFor('LAW-0018').find(x => x.name === 'long-labels-stress').params;
const alt = presetsFor('LAW-0018').find(x => x.name === 'contrast-or-alternative').params;
// safe areas that turn the 16:9 test frame into a square / portrait content box
const SQUARE = {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}};
const PORTRAIT = {safeArea: {top: 0.06, right: 0.36, bottom: 0.2, left: 0.36}};
const CLEAR = 's.captionsClear && s.connectorsAnchored && s.captions.length === s.relationsDrawn.length';
const words = t => String(t).trim().split(/\s+/).join(' ');
const stampWords = presetsFor('LAW-0018').flatMap(pr => [['landscape', {}], ['square', SQUARE], ['portrait', PORTRAIT]].map(([shape, sa]) => ({
  at: 1, params: {...pr.params, ...sa},
  fn: `s.stampLines.join(' ') === ${JSON.stringify(words(pr.params.stampLabel || 'REDACTED COPY'))}`,
  label: `copy-type impression never splits a word (${pr.name}, ${shape})`,
})));

contractSuite('LAW-0018', {
  continuity: ['tracer', 'film'],
  semantic: [
    {at: 0, fn: '!s.tracerVisible && s.filmBands.every(b => b === 0) && s.copyBands.every(b => b === 0)', label: 'starts with an empty film and an uncovered copy'},
    {at: 0.18, fn: 's.filmAtGraphPosition && s.relationsDrawn.every(p => p === 0)', label: 'film reaches its exploded position before any connector is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p > 0) && s.relationsDrawn.some(p => p < 1)', label: 'relations are drawn one by one'},
    {at: 0.44, fn: 's.relationsDrawn.every(p => p === 1) && s.tracerVisible && s.filmBands.every(b => b === 0)', label: 'all relations drawn before the tracer changes anything'},
    {at: 0.5, fn: 's.connectorsAnchored && s.filmAtGraphPosition', label: 'every connector ends on its element edge; the film does not move after connectors exist'},
    {at: 0, fn: "!s.kinds.includes('causal')", label: 'no causal link by default'},
    {at: 0.55, fn: 's.copyBehindFilm', label: 'bands land on the copy only after they exist on the film (0.55)'},
    {at: 0.62, fn: 's.copyBehindFilm', label: 'bands land on the copy only after they exist on the film (0.62)'},
    {at: 0.68, fn: 's.copyBehindFilm', label: 'bands land on the copy only after they exist on the film (0.68)'},
    {at: 0.5, fn: 'Math.abs(s.filmWindow[0] - s.visitU.pen) < 1e-3 && Math.abs(s.filmWindow[1] - s.visitU.film) < 1e-3 && Math.abs(s.copyWindow[0] - s.visitU.film) < 1e-3 && Math.abs(s.copyWindow[1] - s.visitU.copy) < 1e-3', label: 'pen → film: bands drawn while the tracer runs pen → film, landing while it runs film → copy'},
    {at: 1, fn: "s.filmBands.every(b => b === 1) && s.copyBands.every(b => b === 1) && s.delivered && !s.tracerVisible && JSON.stringify(s.visitOrder) === JSON.stringify(['pen','film','copy','folder'])", label: 'ends with the redacted copy filed; traversal order unchanged'},
    {at: 1, fn: 's.stampRelated && s.stampShown', label: 'copy-type impression printed when a stamp–copy relationship is supplied'},
    {at: 0.6, params: {traversalOrder: ['folder', 'copy', 'film', 'pen']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['folder','copy','film','pen'])", label: 'tracer follows the supplied traversal order'},
    {at: 0.9, params: {relationships: [{from: 'pen', to: 'film', kind: 'causal'}, {from: 'film', to: 'copy', kind: 'relation'}]}, fn: "s.kinds.includes('causal') && s.connectorsAnchored", label: 'a causal link appears only when supplied'},
    // alternative traversal (original → copy → film → pen): the marker is
    // reached last, so it draws the band only once the tracer is on it, and
    // the band lands on the copy only after that (reviewer fix)
    {at: 0.7, params: alt, fn: 's.filmBands.every(b => b === 0) && s.copyBands.every(b => b === 0) && s.filmWindow[0] >= s.visitU.pen - 1e-3', label: 'alternative order: no band before the tracer reaches the marker'},
    {at: 0.79, params: alt, fn: 's.tracerVisible && s.filmBands[0] > 0 && s.copyBands[0] === 0', label: 'alternative order: the marker draws the band on the overlay while the tracer rests on it'},
    {at: 0.82, params: alt, fn: 's.filmBands[0] === 1 && s.copyBands[0] > 0 && s.copyBehindFilm && s.copyWindow[0] >= s.filmWindow[1] - 1e-9', label: 'alternative order: the band lands on the copy after it exists on the overlay'},
    {at: 1, params: alt, fn: 's.filmBands[0] === 1 && s.copyBands[0] === 1 && !s.tracerVisible && !s.stampRelated && !s.stampShown', label: 'alternative: no stamp relationship supplied, so no copy-type impression'},
    // captions never sit on another connector, on an element or on a label, so
    // each connector visibly starts and ends at its own element (reviewer fix)
    {at: 1, fn: CLEAR, label: 'captions clear of elements, labels and other connectors (landscape)'},
    {at: 1, params: stress, fn: CLEAR, label: 'captions clear with long labels (landscape)'},
    {at: 1, params: SQUARE, fn: CLEAR, label: 'captions clear (square content box)'},
    {at: 1, params: {...stress, ...SQUARE}, fn: CLEAR, label: 'captions clear with long labels (square content box)'},
    {at: 1, params: PORTRAIT, fn: CLEAR, label: 'captions clear (portrait content box)'},
    {at: 1, params: {...stress, ...PORTRAIT}, fn: CLEAR, label: 'captions clear with long labels (portrait content box)'},
    ...stampWords,
  ],
});

// The copy-type impression comes from the shared motif kit, so its rendered
// text is checked for every kit user: each line holds whole words only and
// the text stays inside the stamp's inner border, for every preset × ratio.
const KIT_USERS = ['LAW-0017', 'LAW-0018', 'LAW-0019', 'LAW-0020'];
test('kit stamp impressions print whole words inside their border (all presets × 16:9/9:16/1:1)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = Object.fromEntries(KIT_USERS.map(id => [id, presetsFor(id)]));
  const out = await page.evaluate(async ({ids, presets}) => {
    const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
    const fails = [];
    let checked = 0;
    for (const id of ids) {
      const def = await window.__lib.load(id);
      for (const pr of presets[id]) {
        for (const [ratio, [w, h]] of Object.entries(RATIOS)) {
          const el = document.createElement('div');
          el.style.cssText = `width:${w / 3}px;height:${h / 3}px`;
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, instanceId: `stamp-${id}-${checked}`, params: pr.params});
          await x.ready;
          x.seek(x.durationMs);
          const params = {...def.defaultParams, ...pr.params};
          const label = id === 'LAW-0017' ? (params.objectLabels || {}).stamp : params.stampLabel;
          const expected = String(label || '').trim().split(/\s+/).join(' ');
          for (const grp of el.querySelectorAll('[data-node$="-impr"]')) {
            const text = grp.querySelector('text');
            if (!text) continue;
            checked++;
            const lines = [...text.querySelectorAll('tspan')].map(t => t.textContent);
            const rects = grp.querySelectorAll('rect');
            const inner = rects[1];
            const ib = {x: +inner.getAttribute('x'), y: +inner.getAttribute('y'), w: +inner.getAttribute('width'), h: +inner.getAttribute('height')};
            const tb = text.getBBox();
            const inside = tb.x >= ib.x - 0.5 && tb.y >= ib.y - 0.5 && tb.x + tb.width <= ib.x + ib.w + 0.5 && tb.y + tb.height <= ib.y + ib.h + 0.5;
            if (lines.join(' ') !== expected || !inside) fails.push({id, preset: pr.name, ratio, node: grp.getAttribute('data-node'), lines, expected, text: {x: tb.x, y: tb.y, w: tb.width, h: tb.height}, inner: ib});
          }
          x.destroy();
          el.remove();
        }
      }
    }
    return {fails, checked};
  }, {ids: KIT_USERS, presets});
  expect(out.checked, 'stamp impressions inspected').toBeGreaterThan(30);
  expect(out.fails, JSON.stringify(out.fails, null, 1)).toEqual([]);
});
