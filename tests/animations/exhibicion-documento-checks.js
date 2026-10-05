// Rendered and data checks for the four "Exhibición de documento" entries (LAW-0301..0304, hearings-06). Earlier checks
// are imported read-only; this file adds the motif's own: no authenticity / admissibility / weight / ruling wording (EN
// and ES, in the supplied data and in the render), every stress text longer than its baseline and every stress list at
// least as long, preset consistency (one document, one detail, a region inside the page), the cue beside each supplied
// state is that state's own glyph, and no text is ever drawn in two places at once (no enlarged copy beside its source).
import {test, expect} from '@playwright/test';
import {forAll} from './apertura-audiencia-checks.js';
import {presetsFor} from '../harness/contract.js';

/** English words that must not leak into a locale-'es' render (default texts). */
export const ES_WORDS = ['Participant', 'Exhibit', 'Room', 'fictional', 'supplied', 'Sequence', 'Presenter', 'Complete', 'document', 'Selected', 'detail', 'region', 'Lines', 'page', 'board', 'Board', 'lectern', 'Lectern', 'cabinet', 'clock', 'configured', 'conclusion', 'Changed', 'zone', 'was'];

/** People floors (coordinator): >= 60 px off 1:1; >= 55 px at 1:1 for every preset except long-labels-stress (>= 45 px). */
export const FLOOR_FOR = "if (ratio !== '1:1') return 60; return preset.replace(' (labels hidden)', '') === 'long-labels-stress' ? 45 : 55;";

/**
 * Banned wording (EN and ES): authenticity, admissibility, admission / exclusion, weight or probative value, rulings,
 * outcomes, win / lose. The motif only shows a supplied document, its reference and a supplied region.
 * ("prueba" — the exhibit — is allowed; "probatorio" is not.)
 */
export const BANNED = /(authentic|aut[eé]ntic|genuin|forg(ed|ery)|falsif|counterfeit|\bfake\b|verified|verificad|certifi|admissib|admisib|inadmis|\badmit|admitid|admisi[oó]n|exclu|\bweight|\bpeso\b|probative|probatori|valor probatorio|evidentiary|\bruling|\bruled\b|\bfallo|resoluci|sustain|overrul|\bgrant|\bdenied|ha lugar|estimad|desestim|\bdecision|decisi[oó]n|\bwins?\b|winner|ganador|\blos(e|es|er|t)\b|perdedor|upheld|reject|rechaz|\bvalid|v[aá]lid[oa]|outcome|resultado|verdict|veredicto|prevail|\bproves?\b|\bproven\b|demuestra|acredita|superior|inferior|jerarq|hierarch|\bcorrect|incorrect|\berror|\bwrong)/i;

/** Every supplied text (defaults and presets' params) is free of the banned wording. */
export function bannedDataTest(ID) {
  test(`${ID}: no supplied text (defaults and presets, EN and ES) names authenticity, admissibility, weight or a ruling`, async () => {
    const def = (await import(`../../src/animations/hearings/${ID}.js`)).default;
    if (!presetsFor(ID).find(q => q.name === 'baseline-es')) throw new Error('no baseline-es preset');
    const all = [{name: 'default', params: def.defaultParams}, ...presetsFor(ID)];
    const bad = [];
    const walk = (v, path, name) => {
      if (typeof v === 'string') { if (BANNED.test(v)) bad.push(`${name} ${path}: "${v}"`); return; }
      if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k], `${path}.${k}`, name);
    };
    for (const pr of all) walk(pr.params, '', pr.name);
    expect(bad, bad.join('\n')).toEqual([]);
    // (the pattern catches the words the coordinator listed, in both languages; it lets the exhibit word through)
    for (const w of ['authentic', 'Authenticity', 'admitted', 'excluded', 'weight', 'probative', 'auténtico', 'admitido', 'excluido', 'valor probatorio', 'admissible', 'inadmisible', 'ruling', 'the winner']) expect(BANNED.test(w), w).toBe(true);
    for (const w of ['Prueba 1, página 2 (ficticia)', 'Exhibit 1, page 2 (fictional)', 'Complete document (as supplied)', 'Selected detail (as supplied)', 'As supplied · no conclusion drawn', 'window']) expect(BANNED.test(w), w).toBe(false);
  });
}

/** The render (every preset, ratio, labels shown, several instants) never shows the banned wording. */
export function bannedRenderTest(ID) {
  test(`${ID}: no rendered text names authenticity, admissibility, weight or a ruling (EN and ES)`, async ({page}) => {
    test.setTimeout(400000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      const re = new RegExp(arg.re, 'i');
      for (const u of [0, 0.3, 0.6, 0.8, 1]) {
        x.seek(u * x.durationMs);
        for (const t of texts(svg, 0.05)) if (re.test(t.textContent)) out.push(pr.name + ' ' + ratio + ': "' + t.textContent.slice(0, 50) + '"');
      }
      return [...new Set(out)];`, {re: BANNED.source}, {withHidden: false});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Stress strictly longer than baseline (coordinator, AUTHORING item 20): every supplied text of long-labels-stress is
 * longer than the same field in the defaults, and every list holds at least as many entries (nested counts).
 */
export function stressLongerTest(ID) {
  test(`${ID}: long-labels-stress — every text field is strictly longer than its baseline counterpart, every list at least as long`, async () => {
    const def = (await import(`../../src/animations/hearings/${ID}.js`)).default;
    const base = def.defaultParams;
    const stress = presetsFor(ID).find(q => q.name === 'long-labels-stress').params;
    const ENUMS = new Set(['kind', 'op', 'form', 'beforeState', 'focusTarget', 'focusElement', 'placement', 'id', 'from', 'to', 'locale', 'textVisibility', 'theme', 'palette', 'background', 'jurisdiction', 'aspectRatio', 'instanceId', 'target', 'finalState', 'traversalOrder', 'hair']);
    const bad = [];
    const walk = (d, s0, path) => {
      if (Array.isArray(d)) {
        if (!Array.isArray(s0)) { bad.push(`${path}: missing list in the stress preset`); return; }
        if (s0.length < d.length) bad.push(`${path}: ${s0.length} entries < ${d.length} in the baseline`);
      }
      if (typeof d === 'string') {
        const key = path.split('.').pop();
        if (ENUMS.has(key) || /\.\d+$/.test(path) && ENUMS.has(path.split('.').slice(-2)[0])) return;
        if (typeof s0 !== 'string') bad.push(`${path}: missing in the stress preset (falls back to "${d}")`);
        else if (s0.length <= d.length) bad.push(`${path}: ${s0.length} <= ${d.length} ("${s0}")`);
        return;
      }
      if (d && typeof d === 'object') for (const k of Object.keys(d)) walk(d[k], s0 ? s0[k] : undefined, path ? `${path}.${k}` : k);
    };
    walk(base, stress, '');
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Preset consistency: one document and one detail; the presenter is a participant; the region lies inside the page
 * (from <= to <= lines); the document's exhibit exists. Rendered at the hold (every preset and ratio, `prefix` room):
 * the reference tag is shown; the enlarged copy and the caption are shown exactly when a detail is enlarged.
 */
export function documentConsistencyTest(ID, {rendered = true, prefix = 'rm', u = 1} = {}) {
  test(`${ID}: every preset supplies one document, one detail and a region inside its page (rendered at the hold)`, async ({page}) => {
    test.setTimeout(300000);
    const def = (await import(`../../src/animations/hearings/${ID}.js`)).default;
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = [];
    for (const pr of presets) {
      const q = {...def.defaultParams, ...pr.params};
      const n = k => q.statements.filter(s => s.kind === k).length;
      if (n('document') !== 1 || n('detail') !== 1) bad.push(`${pr.name}: ${n('document')} document / ${n('detail')} detail`);
      if (q.presenter >= q.speakers.length) bad.push(`${pr.name}: presenter ${q.presenter} is not a participant`);
      const d = q.document;
      if (!(d.region.from >= 1 && d.region.from <= d.region.to && d.region.to <= d.lines)) bad.push(`${pr.name}: region ${d.region.from}–${d.region.to} outside a ${d.lines}-line page`);
      if (d.exhibit >= q.exhibits.length) bad.push(`${pr.name}: document exhibit ${d.exhibit} does not exist`);
      if (new Set(q.sequence).size !== q.sequence.length || q.sequence.some(v => v > 1)) bad.push(`${pr.name}: sequence ${q.sequence.join(',')}`);
    }
    if (rendered) {
      await page.goto('/tests/harness/host.html');
      await page.waitForFunction(() => document.body.dataset.ready === '1');
      const res = await page.evaluate(async ([id, presets, prefix, u]) => {
        const def = await window.__lib.load(id);
        const out = [];
        for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
          const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: pr.params});
          await x.ready; x.seek(u * x.durationMs);
          const s = x.getState({bounds: false}).semantic;
          const svg = x.element;
          const op = e => { if (!e) return 0; let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
          const q = sel => svg.querySelector(sel);
          const tag = `${pr.name} ${w}x${h}`;
          if (op(q(`[data-node="${prefix}-tag"]`)) < 0.95) out.push(`${tag}: the reference tag is not shown`);
          const want = s.finalState !== 'document-only' && s.detailShown !== false;
          const zc = [...svg.querySelectorAll(`[data-node^="${prefix}-zcopy-"]`)].map(op);
          const zShown = zc.some(v => v > 0.95), cap = op(q(`[data-node="${prefix}-cap"]`)) > 0.95;
          if (want !== zShown) out.push(`${tag}: enlarged copy shown ${zShown} (expected ${want})`);
          if (want !== cap) out.push(`${tag}: caption shown ${cap} (expected ${want})`);
          x.destroy(); el.remove();
        }
        return out;
      }, [ID, presets, prefix, u]);
      bad.push(...res);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * The cue beside each supplied state is that state's own glyph, everywhere it is drawn: ● (a circle) on the reference
 * tag and in the legend row of the complete document; ◆ (a diamond) on the caption plate and in the detail row; the two
 * with the same ink area (`prefix` room; at `at`).
 */
export function glyphStateTest(ID, {prefixes = ['rm'], at = [1]} = {}) {
  test(`${ID}: ● is drawn beside the complete document and ◆ beside the selected detail, everywhere, with equal ink`, async ({page}) => {
    test.setTimeout(300000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      const tag = pr.name + ' ' + ratio;
      const kind = e => { if (!e) return null; const c = e.tagName === 'circle' ? e : e.querySelector && e.querySelector('circle'); const p = e.tagName === 'path' ? e : e.querySelector && e.querySelector('path'); return c ? 'dot' : p ? 'diamond' : null; };
      const ink = e => { const q = e.getBoundingClientRect(); return e.tagName === 'circle' ? Math.PI * q.width * q.height / 4 : q.width * q.height / 2; };
      for (const u of arg.at) {
        x.seek(u * x.durationMs);
        for (const P of arg.prefixes) {
          const a = node(svg, P + '-tagplate-g'), b = node(svg, P + '-capplate-g') || node(svg, P + '-cap-g');
          if (a && eff(svg, a) > 0.5 && kind(a) !== 'dot') out.push(tag + ' ' + P + ': the reference tag does not carry ●');
          if (b && eff(svg, b) > 0.5 && kind(b) !== 'diamond') out.push(tag + ' ' + P + ': the caption does not carry ◆');
          if (a && b && eff(svg, a) > 0.5 && eff(svg, b) > 0.5) { const ia = ink(a), ib = ink(b); if (Math.max(ia, ib) / Math.max(1e-6, Math.min(ia, ib)) > 1.12) out.push(tag + ' ' + P + ': ink ' + ia.toFixed(0) + ' vs ' + ib.toFixed(0)); }
        }
        const rd = node(svg, 'lg-document'), rt = node(svg, 'lg-detail');
        if (rd && kind(rd.querySelector('g')) !== 'dot') out.push(tag + ': the legend row of the complete document is not ●');
        if (rt && kind(rt.querySelector('g')) !== 'diamond') out.push(tag + ': the legend row of the selected detail is not ◆');
      }
      return out;`, {at, prefixes}, {withHidden: true});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * No text is drawn in two places at once (coordinator): at every sampled u (step 0.01), no visible text string appears
 * twice in the frame — an enlarged copy never stands beside its source.
 */
export function noTwinTextTest(ID, {step = 0.01, allow = []} = {}) {
  test(`${ID}: no text is shown in two places at once (step ${step}, every preset × ratio × labels)`, async ({page}) => {
    test.setTimeout(600000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      for (let u = 0; u <= 1.0001; u += arg.step) {
        x.seek(u * x.durationMs);
        const seen = new Map();
        for (const t of texts(svg, 0.15)) {
          const s = (t.textContent || '').replace(/\\s+/g, ' ').trim();
          if (!s || s.length < 3 || arg.allow.includes(s)) continue;
          seen.set(s, (seen.get(s) || 0) + 1);
        }
        for (const [s, n] of seen) if (n > 1) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': "' + s.slice(0, 40) + '" ×' + n);
      }
      return [...new Set(out)].slice(0, 20);`, {step, allow}, {withHidden: true});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}
