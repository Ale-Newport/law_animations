// Local inspection gallery (gallery/index.html): catalogue, lazy loading,
// playback controls, presets, parameter form, cleanup and still export.
// Uses only IDs from the protected reference motif (LAW-0001..0004) plus
// planned IDs, so it stays valid while other modules are being added.
import fs from 'node:fs';
import {test, expect} from '@playwright/test';

const watchers = new WeakMap();

test.beforeEach(async ({page}) => {
  const w = {errors: [], external: []};
  page.on('console', m => { if (m.type() === 'error') w.errors.push(m.text()); });
  page.on('pageerror', e => w.errors.push(String(e)));
  page.on('request', r => {
    const u = new URL(r.url());
    if (u.protocol === 'blob:' || u.protocol === 'data:') return;
    if (u.hostname !== '127.0.0.1') w.external.push(r.url());
  });
  watchers.set(page, w);
});

test.afterEach(async ({page}) => {
  const w = watchers.get(page);
  expect(w.errors, 'console errors').toEqual([]);
  expect(w.external, 'requests to non-loopback hosts').toEqual([]);
});

async function open(page, hash = '') {
  await page.goto(`/gallery/${hash}`);
  await page.waitForFunction(() => document.body.dataset.ready === '1');
}

async function search(page, text) {
  await page.fill('#q', text);
  // The search input is debounced; wait until the list reflects the query.
  await page.waitForFunction(q => {
    const input = document.querySelector('#q');
    return input.value === q && window.__gallery && document.querySelector('#count').textContent.length > 0;
  }, text);
  await page.waitForTimeout(250);
}

async function choose(page, id) {
  await search(page, id);
  await page.click(`#opt-${id}`);
  await page.waitForFunction(i => {
    const inst = window.__gallery.instance;
    return inst && inst.id === i && inst.isReady && document.querySelector('#param-fields').childElementCount > 0;
  }, id);
}

const state = page => page.evaluate(() => {
  const st = window.__gallery.instance.getState({bounds: false});
  return {timeMs: st.timeMs, width: st.width, height: st.height, layoutShape: st.layoutShape, params: st.params, nodes: JSON.stringify(st.nodes)};
});

const loadedAnimationModules = page => page.evaluate(() => performance.getEntriesByType('resource')
  .map(e => new URL(e.name).pathname)
  .filter(p => /^\/src\/animations\/.+\/LAW-\d{4}\.js$/.test(p)));

test('loads all 2,000 IDs as a virtualised list without mounting or importing animations', async ({page}) => {
  await open(page);
  await expect(page.locator('#totals')).toContainText('2,000 IDs');
  expect(await page.evaluate(() => window.__gallery.filteredCount)).toBe(2000);
  const rows = await page.evaluate(() => window.__gallery.renderedRows);
  expect(rows).toBeGreaterThan(3);
  expect(rows).toBeLessThan(40);
  expect(await page.locator('#list-inner').evaluate(n => n.getBoundingClientRect().height)).toBe(2000 * 76);
  expect(await page.locator('svg[data-animation-id]').count()).toBe(0);
  expect(await loadedAnimationModules(page)).toEqual([]);
  // The list shows static thumbnails only: no <svg> or <video> inside rows.
  expect(await page.locator('#list svg, #list video, #list canvas').count()).toBe(0);
  // Scrolling far down renders the rows for that position, not all rows.
  await page.locator('#list').evaluate(n => { n.scrollTop = 1500 * 76; });
  await expect(page.locator('#opt-LAW-1501')).toBeVisible();
  expect(await page.evaluate(() => window.__gallery.renderedRows)).toBeLessThan(40);
});

test('search finds LAW-0001 by ID, number, motif words and objects', async ({page}) => {
  await open(page);
  await search(page, 'LAW-0001');
  expect(await page.evaluate(() => window.__gallery.filteredCount)).toBe(1);
  await expect(page.locator('#list .item').first()).toHaveAttribute('data-id', 'LAW-0001');
  await search(page, '1');
  await expect(page.locator('#list .item').first()).toHaveAttribute('data-id', 'LAW-0001');
  await search(page, 'firma documento');
  await expect(page.locator('#opt-LAW-0001')).toBeVisible();
  await search(page, 'sello');
  expect(await page.evaluate(() => window.__gallery.filteredCount)).toBeGreaterThan(0);
  // Accent-insensitive: "investigacion" matches "Investigación".
  await search(page, 'investigacion');
  expect(await page.evaluate(() => window.__gallery.filteredCount)).toBeGreaterThan(0);
  // Tags from the saved module metadata ("handoff") are searchable.
  await search(page, 'handoff');
  await expect.poll(() => page.locator('#opt-LAW-0001').count()).toBe(1);
  // Filters combine with the query; an exact phrase match ranks first.
  await search(page, 'firma de documento');
  await page.selectOption('#f-treatment', 'inspect');
  await expect(page.locator('#list .item').first()).toHaveAttribute('data-id', 'LAW-0004');
  const ids = await page.locator('#list .item').evaluateAll(rows => rows.map(r => r.dataset.id));
  expect(ids.every(id => ['LAW-0001', 'LAW-0002', 'LAW-0003'].indexOf(id) === -1)).toBe(true);
});

test('planned items are shown as pending, never ready, and cannot be previewed', async ({page}) => {
  await open(page);
  await search(page, 'LAW-2000');
  const row = page.locator('#opt-LAW-2000');
  await expect(row.locator('.chip')).toHaveText('Pending');
  await expect(row.locator('.thumb.placeholder')).toHaveText('pending');
  await row.click();
  await expect(page.locator('#pending')).toBeVisible();
  await expect(page.locator('#d-badge')).toHaveText('Pending');
  await expect(page.locator('#player')).toBeHidden();
  expect(await page.locator('svg[data-animation-id]').count()).toBe(0);
  await search(page, '');
  await page.selectOption('#f-status', 'pending');
  const chips = await page.locator('#list .item .chip').allTextContents();
  expect(chips.length).toBeGreaterThan(3);
  expect(new Set(chips)).toEqual(new Set(['Pending']));
  const all = await page.locator('body').innerText();
  expect(all).not.toMatch(/\bready\b/i);
});

test('selecting LAW-0001 mounts exactly one SVG and imports only that module', async ({page}) => {
  await open(page);
  await choose(page, 'LAW-0001');
  await expect(page.locator('#mount > svg')).toHaveCount(1);
  await expect(page.locator('#mount > svg')).toHaveAttribute('data-animation-id', 'LAW-0001');
  expect(await page.locator('svg[data-animation-id]').count()).toBe(1);
  expect(await loadedAnimationModules(page)).toEqual(['/src/animations/documents/LAW-0001.js']);
  await expect(page.locator('#d-notice')).toContainText('Jurisdiction: unspecified');
  await expect(page.locator('#d-notice')).toContainText('illustrative-unverified');
  // The badge reflects the recorded production status, and only "accepted" reads as accepted.
  const status = await page.evaluate(async () => (await (await fetch('/gallery/catalog-index.json')).json()).find(e => e.id === 'LAW-0001').status);
  if (status === 'accepted') await expect(page.locator('#d-badge')).toHaveText('Accepted');
  else await expect(page.locator('#d-badge')).not.toHaveText('Accepted');
});

test('scrubber, time field and frame stepping seek the instance deterministically', async ({page}) => {
  await open(page);
  await choose(page, 'LAW-0001');
  const at0 = await state(page);
  expect(at0.timeMs).toBe(0);
  await page.locator('#scrub').fill('3000');
  const at3000 = await state(page);
  expect(at3000.timeMs).toBe(3000);
  expect(at3000.nodes).not.toBe(at0.nodes);
  await page.locator('#scrub').fill('5000');
  await page.locator('#scrub').fill('3000');
  expect((await state(page)).nodes).toBe(at3000.nodes);

  await page.click('#b-next');
  expect((await state(page)).timeMs).toBeCloseTo(3000 + 1000 / 30, 6);
  await expect(page.locator('#t-frame')).toContainText('Frame 91 of 180 at 30 fps');
  await page.selectOption('#fps', '24');
  await page.click('#b-next');
  expect((await state(page)).timeMs).toBeCloseTo((73 * 1000) / 24, 6);
  await page.click('#b-prev');
  await page.click('#b-prev');
  expect((await state(page)).timeMs).toBeCloseTo((71 * 1000) / 24, 6);
  await page.selectOption('#fps', '60');
  await page.click('#b-prev');
  expect((await state(page)).timeMs).toBeCloseTo((177 * 1000) / 60, 6);

  // Keyboard shortcuts on the focused stage: arrows step frames at the chosen fps.
  await page.focus('#stage');
  await page.keyboard.press('ArrowRight');
  expect((await state(page)).timeMs).toBeCloseTo((178 * 1000) / 60, 6);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  expect((await state(page)).timeMs).toBeCloseTo((176 * 1000) / 60, 6);

  await page.fill('#t-ms', '1234');
  await page.press('#t-ms', 'Enter');
  expect((await state(page)).timeMs).toBe(1234);
  await page.fill('#t-ms', '999999');
  await page.press('#t-ms', 'Enter');
  expect((await state(page)).timeMs).toBe(6000);

  // Playback (gallery-owned requestAnimationFrame) advances by seeking.
  await page.locator('#scrub').fill('0');
  await page.click('#b-play');
  await expect(page.locator('#b-play')).toHaveText('Pause');
  await expect.poll(async () => (await state(page)).timeMs).toBeGreaterThan(100);
  await page.click('#b-play');
  await expect(page.locator('#b-play')).toHaveText('Play');
  const paused = (await state(page)).timeMs;
  await page.waitForTimeout(200);
  expect((await state(page)).timeMs).toBe(paused);
  // Replay restarts from the beginning.
  await page.locator('#scrub').fill('5900');
  await page.click('#b-replay');
  await expect.poll(async () => (await state(page)).timeMs).toBeLessThan(5900);
  await page.click('#b-play');
  // Playback is finite: it stops on the held final state.
  await page.selectOption('#speed', '1');
  await page.locator('#scrub').fill('5800');
  await page.click('#b-play');
  await expect(page.locator('#b-play')).toHaveText('Play', {timeout: 5000});
  expect((await state(page)).timeMs).toBe(6000);
});

test('preset change applies the saved parameters and keeps the time', async ({page}) => {
  await open(page);
  await choose(page, 'LAW-0001');
  await page.locator('#scrub').fill('4000');
  const optionValues = await page.locator('#p-select option').evaluateAll(os => os.map(o => o.value));
  expect(optionValues).toEqual(expect.arrayContaining(['saved:baseline-illustrative', 'saved:contrast-or-alternative', 'saved:long-labels-stress']));
  await page.selectOption('#p-select', 'saved:contrast-or-alternative');
  await expect.poll(async () => (await state(page)).params.finalState).toBe('signed-retained');
  const st = await state(page);
  expect(st.params.documentTitle).toBe('Equipment Lease');
  expect(st.timeMs).toBe(4000);
  await expect(page.locator('#mount svg text', {hasText: 'Equipment Lease'}).first()).toBeAttached();
  await expect(page.locator('#f-documentTitle')).toHaveValue('Equipment Lease');
  await expect(page.locator('#mount > svg')).toHaveCount(1);
  await page.selectOption('#p-select', 'saved:baseline-es');
  await expect.poll(async () => (await state(page)).params.locale).toBe('es');
  await expect(page.locator('#v-locale')).toHaveValue('es');
  await page.click('#p-reset');
  await expect.poll(async () => (await state(page)).params.documentTitle).toBe('Service Agreement');
  expect((await state(page)).params.locale).toBe('en');
});

test('schema form edits parameters and shows validation problems', async ({page}) => {
  await open(page);
  await choose(page, 'LAW-0001');
  await page.fill('#f-documentTitle', 'Office Lease Agreement');
  await page.locator('#f-documentTitle').blur();
  await expect.poll(async () => (await state(page)).params.documentTitle).toBe('Office Lease Agreement');
  await expect(page.locator('#p-select')).toHaveValue('edited');

  await page.fill('#f-documentTitle', 'x'.repeat(130));
  await page.locator('#f-documentTitle').blur();
  await expect(page.locator('#param-errors')).toContainText('at most 120 characters');
  await expect(page.locator('#f-documentTitle')).toHaveAttribute('aria-invalid', 'true');
  expect((await state(page)).params.documentTitle).toBe('Office Lease Agreement');
  // A later valid change clears the problem and resets the rejected input to
  // the value the preview actually uses.
  await page.selectOption('#f-finalState', 'signed-retained');
  await expect(page.locator('#param-errors')).toBeHidden();
  await expect(page.locator('#f-documentTitle')).toHaveValue('Office Lease Agreement');
  await expect(page.locator('#f-documentTitle')).not.toHaveAttribute('aria-invalid', 'true');

  await page.fill('#f-clauses', '["Only clause"');
  await page.locator('#f-clauses').blur();
  await expect(page.locator('#f-clauses')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#param-fields')).toContainText('invalid JSON');
  await page.fill('#f-clauses', '["Only clause"]');
  await page.locator('#f-clauses').blur();
  await expect.poll(async () => (await state(page)).params.clauses).toEqual(['Only clause']);

  await page.fill('#f-clauses', '[]');
  await page.locator('#f-clauses').blur();
  await expect(page.locator('#param-errors')).toContainText('params.clauses');

  // Nested object fields patch one property.
  await page.fill('#f-actorLabels-a', 'Author of the signature');
  await page.locator('#f-actorLabels-a').blur();
  await expect.poll(async () => (await state(page)).params.actorLabels).toEqual({a: 'Author of the signature', b: 'Receiving party'});

  // Numbers and enums.
  await page.fill('#f-durationMs', '500');
  await page.locator('#f-durationMs').blur();
  await expect(page.locator('#param-errors')).toContainText('must be >= 1000');
  await page.fill('#f-durationMs', '9000');
  await page.locator('#f-durationMs').blur();
  await expect.poll(async () => (await state(page)).params.durationMs).toBe(9000);
  await expect(page.locator('#scrub')).toHaveAttribute('max', '9000');
  await page.selectOption('#f-finalState', 'pending');
  await expect.poll(async () => (await state(page)).params.finalState).toBe('pending');
});

test('display controls change aspect ratio, labels, background and motion through the API', async ({page}) => {
  await open(page);
  await choose(page, 'LAW-0002');
  await page.locator('#scrub').fill('2000');
  await page.selectOption('#v-ratio', '9:16');
  let st = await state(page);
  expect([st.width, st.height, st.layoutShape, st.timeMs]).toEqual([1080, 1920, 'portrait', 2000]);
  await page.selectOption('#v-ratio', '1:1');
  st = await state(page);
  expect([st.width, st.height]).toEqual([1080, 1080]);
  await page.selectOption('#v-text', 'none');
  await page.selectOption('#v-bg', 'charcoal');
  await page.selectOption('#v-palette', 'slate');
  await page.check('#v-reduced');
  st = await state(page);
  expect(st.params).toMatchObject({textVisibility: 'none', background: 'charcoal', palette: 'slate', reducedMotion: true});
  await expect(page.locator('#frame')).toHaveClass(/solid/);
  await page.selectOption('#v-bg', 'custom');
  await page.locator('#v-bg-color').evaluate(n => { n.value = '#334455'; n.dispatchEvent(new Event('input', {bubbles: true})); });
  expect((await state(page)).params.background).toBe('#334455');
  await page.check('#v-guides');
  await expect(page.locator('#guides')).toBeVisible();
  await page.selectOption('#v-locale', 'es');
  expect((await state(page)).params.locale).toBe('es');
});

test('switching items destroys the previous instance', async ({page}) => {
  await open(page);
  await choose(page, 'LAW-0001');
  await page.evaluate(() => { window.__old = window.__gallery.instance; });
  await choose(page, 'LAW-0002');
  expect(await page.evaluate(() => window.__old.destroyed)).toBe(true);
  expect(await page.evaluate(() => { try { window.__old.seek(10); return 'no error'; } catch (e) { return e.message; } })).toMatch(/destroyed/);
  await expect(page.locator('svg[data-animation-id]')).toHaveCount(1);
  await expect(page.locator('#mount > svg')).toHaveAttribute('data-animation-id', 'LAW-0002');
  // Repeated switching does not accumulate instances.
  for (const id of ['LAW-0003', 'LAW-0004', 'LAW-0001', 'LAW-0003']) {
    await page.evaluate(() => { window.__old = window.__gallery.instance; });
    await choose(page, id);
    expect(await page.evaluate(() => window.__old.destroyed)).toBe(true);
    await expect(page.locator('svg[data-animation-id]')).toHaveCount(1);
  }
  // Rapid selection without waiting: only the last choice stays mounted.
  await page.evaluate(() => { window.__gallery.select('LAW-0002'); window.__gallery.select('LAW-0004'); window.__gallery.select('LAW-0001'); });
  await page.waitForFunction(() => window.__gallery.instance && window.__gallery.instance.id === 'LAW-0001' && window.__gallery.instance.isReady);
  await page.waitForTimeout(300);
  await expect(page.locator('svg[data-animation-id]')).toHaveCount(1);
  await expect(page.locator('#mount > svg')).toHaveAttribute('data-animation-id', 'LAW-0001');
  // Selecting a pending item removes the preview entirely.
  await page.evaluate(() => { window.__old = window.__gallery.instance; });
  await search(page, 'LAW-1999');
  await page.click('#opt-LAW-1999');
  await expect(page.locator('#pending')).toBeVisible();
  expect(await page.evaluate(() => window.__old.destroyed)).toBe(true);
  await expect(page.locator('svg[data-animation-id]')).toHaveCount(0);
});

test('personal presets persist in localStorage', async ({page}) => {
  await open(page);
  await choose(page, 'LAW-0001');
  await page.fill('#f-documentTitle', 'Personal Title');
  await page.locator('#f-documentTitle').blur();
  await expect.poll(async () => (await state(page)).params.documentTitle).toBe('Personal Title');
  await page.fill('#p-name', 'my test preset');
  await page.click('#p-save');
  await expect(page.locator('#p-select')).toHaveValue('personal:my test preset');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('law-gallery:v1:personal:LAW-0001')));
  expect(stored[0].name).toBe('my test preset');
  expect(stored[0].params.documentTitle).toBe('Personal Title');
  expect(new URL(page.url()).hash).toBe('#LAW-0001');
  await page.reload();
  await page.waitForFunction(() => document.body.dataset.ready === '1' && window.__gallery.instance && window.__gallery.instance.isReady);
  expect((await state(page)).params.documentTitle).toBe('Service Agreement');
  await page.selectOption('#p-select', 'personal:my test preset');
  await expect.poll(async () => (await state(page)).params.documentTitle).toBe('Personal Title');
  await page.click('#p-delete');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('law-gallery:v1:personal:LAW-0001')))).toEqual([]);
});

test('works when browser storage is blocked', async ({page}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {get() { throw new DOMException('blocked', 'SecurityError'); }});
  });
  await open(page, '#LAW-0001');
  await page.waitForFunction(() => window.__gallery.instance && window.__gallery.instance.isReady);
  await page.selectOption('#v-ratio', '1:1');
  expect((await state(page)).width).toBe(1080);
  await page.fill('#p-name', 'cannot persist');
  await page.click('#p-save');
  await expect(page.locator('#p-msg')).toContainText('browser storage is unavailable');
  await expect(page.locator('#mount > svg')).toHaveCount(1);
});

test('still export saves SVG and PNG of the current frame; there is no video export', async ({page}) => {
  await open(page);
  await choose(page, 'LAW-0001');
  await page.locator('#scrub').fill('2500');
  const [svgDl] = await Promise.all([page.waitForEvent('download'), page.click('#x-svg')]);
  expect(svgDl.suggestedFilename()).toBe('LAW-0001_baseline-illustrative_16x9_2500ms.svg');
  const svg = fs.readFileSync(await svgDl.path(), 'utf8');
  expect(svg.startsWith('<?xml')).toBe(true);
  expect(svg).toContain('data-animation-id="LAW-0001"');
  expect(svg).toContain('width="1920"');
  expect(svg).not.toMatch(/<script|<foreignObject|<image|href="http/i);
  const [pngDl] = await Promise.all([page.waitForEvent('download'), page.click('#x-png')]);
  expect(pngDl.suggestedFilename()).toBe('LAW-0001_baseline-illustrative_16x9_2500ms.png');
  const png = fs.readFileSync(await pngDl.path());
  expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(png.readUInt32BE(16)).toBe(1920);
  expect(png.readUInt32BE(20)).toBe(1080);
  expect((await state(page)).timeMs).toBe(2500);
  const labels = await page.locator('button, a[download], [role="button"]').allTextContents();
  for (const label of labels) expect(label).not.toMatch(/mp4|webm|mov\b|gif|video|record|encode/i);
  await expect(page.locator('#b-replay')).toHaveText('Replay');
  expect(await page.locator('button', {hasText: /loop/i}).count()).toBe(0);
});

test('metadata and source views load the selected module text', async ({page}) => {
  await open(page);
  await choose(page, 'LAW-0001');
  await page.click('#meta-box > summary');
  await expect(page.locator('#meta')).toContainText('illustrative-unverified');
  await expect(page.locator('#meta')).toContainText('Current state (getState)');
  await page.click('#source-box > summary');
  await expect(page.locator('#source')).toContainText('export default defineAnimation');
  await expect(page.locator('#source')).toContainText("'LAW-0001'");
  await page.click('#source-files button[data-path$="LAW-0001.presets.json"]');
  await expect(page.locator('#source')).toContainText('long-labels-stress');
});

test('mobile viewport (390px) has no horizontal scroll and still previews', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await open(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.click('#opt-LAW-0003');
  await page.waitForFunction(() => window.__gallery.instance && window.__gallery.instance.isReady);
  await expect(page.locator('#mount > svg')).toHaveCount(1);
  for (const sel of ['#source-box > summary', '#meta-box > summary']) await page.click(sel);
  await expect(page.locator('#source')).toContainText('LAW-0003');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const box = await page.locator('#frame').boundingBox();
  expect(box.width).toBeGreaterThan(300);
});

test('the server root opens the gallery without failed requests', async ({page}) => {
  const failed = [];
  page.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
  await page.goto('/');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  expect(new URL(page.url()).pathname).toBe('/gallery/');
  await expect(page.locator('#totals')).toContainText('2,000 IDs');
  expect(failed).toEqual([]);
});
