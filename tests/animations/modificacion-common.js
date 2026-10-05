// Shared test blocks for the "Modificación del escrito" items (LAW-0265..0268): item 20 stress rules, banned words,
// labels-hidden text, cold create. Each item's test file calls these with its own ID.
import {presetsFor} from '../harness/contract.js';

const ENUM_KEYS = /\.(target|state|kind|id|from|to|focusElement|focusTarget|finalState|locale|placement|traversalOrder\[\d+\])$/;
import {ratioChecks} from '../harness/ratio-checks.js';
import {NO_TEXT_HIDDEN, BANNED, BANNED_TEXT} from './modificacion-checks.js';

/**
 * Item 20: the stress preset never lowers a count (every array, nested ones included, is at least as long as the
 * baseline's) and every supplied text it sets is strictly longer than the baseline's.
 */
export function stressRules(ID, {test, expect}) {
  test(`${ID}: long-labels-stress — every count >= baseline (nested arrays too), every text strictly longer`, async () => {
    const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
    const st = presetsFor(ID).find(q => q.name === 'long-labels-stress').params;
    const short = [], notLonger = [];
    const walk = (b, s, path) => {
      if (Array.isArray(b)) {
        if (Array.isArray(s)) {
          if (s.length < b.length) short.push(`${path}: ${s.length} < ${b.length}`);
          b.forEach((x, i) => { if (s[i] !== undefined) walk(x, s[i], `${path}[${i}]`); });
        }
        return;
      }
      // (enumerated values — targets, states, kinds, ids — are choices, not texts)
      if (typeof b === 'string' && typeof s === 'string') { if (b && !ENUM_KEYS.test(path) && s.length <= b.length) notLonger.push(`${path}: ${s.length} <= ${b.length}`); return; }
      if (b && typeof b === 'object' && s && typeof s === 'object') for (const k of Object.keys(b)) if (k in s) walk(b[k], s[k], `${path}.${k}`);
    };
    walk(def.defaultParams, st, 'params');
    expect(short).toEqual([]);
    expect(notLonger).toEqual([]);
  });
}

/** Legal: no banned word (approved, rejected, permission, time limits, admissible, effect, …; EN + ES) in any preset or rendered text. */
export function bannedWords(ID, {test, expect}) {
  test(`${ID}: banned words — no amendment rule, approval or effect in any preset text`, async () => {
    const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
    const strs = [];
    const walk = v => { if (typeof v === 'string') strs.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
    walk(def.defaultParams);
    for (const pr of presetsFor(ID)) walk(pr.params);
    expect(strs.filter(t => BANNED.test(t))).toEqual([]);
  });
  ratioChecks(ID, 'legal: banned words in the rendered text', [
    {at: [0.5, 1], tv: ['all'], dom: BANNED_TEXT, label: 'RENDERED: no banned word in any visible text (EN presets)'},
    {at: [0.5, 1], tv: ['all'], presets: ['default'], params: {locale: 'es'}, dom: BANNED_TEXT, label: 'RENDERED: no banned word with locale "es"'},
  ]);
}

/** With labels hidden no label text is drawn at any sampled u. */
export function hiddenText(ID, times) {
  ratioChecks(ID, 'labels hidden: no label text', [
    {at: times, tv: ['none'], dom: NO_TEXT_HIDDEN, label: 'RENDERED: labels hidden — no label text anywhere at any sampled u'},
  ]);
}

/** Cold create: every preset × ratio in its own fresh page creates and seeks within ~1 s. */
export function coldCreate(ID, {test, expect}) {
  test(`${ID}: cold create <= 1000 ms in a fresh page, every preset × ratio`, async ({browser, baseURL}) => {
    test.setTimeout(300000);
    const slow = [];
    for (const pr of [{name: 'default', params: {}}, ...presetsFor(ID)]) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const page = await browser.newPage({baseURL});
      await page.goto('/tests/harness/host.html');
      await page.waitForFunction(() => document.body.dataset.ready === '1');
      const ms = await page.evaluate(async ([id, params, w2, h2]) => {
        const def = await window.__lib.load(id);
        const el = document.createElement('div'); document.body.appendChild(el);
        const t0 = performance.now();
        const x = def.create(el, {width: w2, height: h2, params}); await x.ready; x.seek(x.durationMs * 0.5);
        return performance.now() - t0;
      }, [ID, pr.params, w, h]);
      await page.close();
      if (ms > 1000) slow.push(`${pr.name} ${w}x${h}: ${Math.round(ms)} ms`);
    }
    expect(slow).toEqual([]);
  });
}

/** Legal glyph checks: only ● / ◆ glyphs (no ticks), no green; equal weight. `sel` selects the glyph groups. */
export const glyphChecks = sel => {
  const neutral = `(() => {
  const hue = c => { const m = /^#([0-9a-f]{6})$/i.exec(c || ''); if (!m) return -1; const n = parseInt(m[1], 16); const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 0.08) return -1; const d = mx - mn; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };
  const green = c => { const h = hue(c); return h >= 75 && h <= 165; };
  const glyphs = [...svg.querySelectorAll(${JSON.stringify(sel)})];
  if (!glyphs.length) return false;
  const shapesOk = glyphs.every(g => [...g.querySelectorAll('path, circle, polyline, line')].every(e => e.tagName === 'circle' || (e.tagName === 'path' && (e.getAttribute('d').match(/[LM]/g) || []).length === 4)));
  return shapesOk && glyphs.flatMap(g => [...g.querySelectorAll('*')]).every(e => !green(e.getAttribute('fill')) && !green(e.getAttribute('stroke'))) && !svg.querySelector('polyline');
})()`;
  const equal = `(() => {
  const gs = [...svg.querySelectorAll(${JSON.stringify(sel)})].map(g => g.firstElementChild).filter(Boolean);
  const circles = gs.filter(e => e.tagName === 'circle'), dias = gs.filter(e => e.tagName !== 'circle');
  if (!circles.length || !dias.length) return true;
  const area = e => { const b = e.getBBox(); return e.tagName === 'circle' ? Math.PI * (b.width / 2) ** 2 : b.width * b.height / 2; };
  const pairs = circles.flatMap(c => dias.map(d => area(c) / area(d)));
  return new Set(gs.map(e => e.getAttribute('stroke-width'))).size === 1 && pairs.some(q => q > 1 / 1.3 && q < 1.3);
})()`;
  return {neutral, equal};
};
