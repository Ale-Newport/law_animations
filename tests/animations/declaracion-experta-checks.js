// Rendered and data checks for the four "Declaración experta en audiencia" entries (LAW-0305..0308, hearings-07).
// Earlier checks are imported read-only; this file adds the motif's own: no expert-evidence rule, test, standard,
// weight, reliability, credibility, acceptance or outcome wording (EN and ES, in the supplied data and in the render),
// no jurisdiction named anywhere (and the render says "jurisdiction unspecified"), every stress text longer than its
// baseline and every stress list at least as long, preset consistency (one measurement, one interpretation, a span
// inside the chart), the cue beside each supplied state is that state's own glyph, and no text is ever drawn twice.
import {test, expect} from '@playwright/test';
import {forAll} from './apertura-audiencia-checks.js';
import {presetsFor} from '../harness/contract.js';

/** English words that must not leak into a locale-'es' render (default texts). */
export const ES_WORDS = ['Participant', 'Exhibit', 'Room', 'fictional', 'supplied', 'Sequence', 'Specialist', 'Measurement', 'interpretation', 'Interpretation', 'Chart', 'chart', 'Reading', 'points', 'span', 'board', 'Board', 'lectern', 'Lectern', 'cabinet', 'clock', 'configured', 'conclusion', 'Changed', 'explanation', 'was'];

/** People floors (coordinator): >= 60 px off 1:1; >= 55 px at 1:1 for every preset except long-labels-stress (>= 45 px). */
export const FLOOR_FOR = "if (ratio !== '1:1') return 60; return preset.replace(' (labels hidden)', '') === 'long-labels-stress' ? 45 : 55;";

/**
 * Banned wording (EN and ES): expert-evidence rules and tests (admissibility, qualification, court appointment, duties
 * to the court, named standards such as Daubert, Frye or the CPR), weight or probative value, reliability, credibility,
 * acceptance / rejection, right / wrong, rulings, outcomes, win / lose. The motif only shows a supplied chart, its
 * reference, a supplied span and a supplied explanation. ("prueba" — the exhibit — is allowed; "probatorio" is not.)
 */
export const BANNED = /(admissib|admisib|inadmis|\badmit|admitid|admisi[oó]n|exclu|qualif|cualific|idoneidad|court[- ]appointed|perito designado|designad[oa] por el tribunal|\bduty|\bduties|deber(es)? (con|ante) el tribunal|daubert|\bfrye\b|\bcpr\b|rule 702|\bfre\b|peer[- ]review|\bstandard|\bweight|\bpeso\b|probative|probatori|evidentiary|reliab|fiab|credib|cre[ií]b|trustworth|\bconvinc|\baccept|\bacept|reject|rechaz|\bruling|\bruled\b|\bfallo|resoluci|sustain|overrul|\bgrant|\bdenied|ha lugar|estimad|desestim|\bdecision|decisi[oó]n|\bwins?\b|winner|ganador|\blos(e|es|er|t)\b|perdedor|upheld|\bvalid|v[aá]lid[oa]|outcome|resultado|verdict|veredicto|prevail|\bproves?\b|\bproven\b|demuestra|acredita|superior|inferior|jerarq|hierarch|\bcorrect|incorrect|\berror|\bwrong|equivocad|acertad|\bright\b|\btrue\b|\bfalse\b|verdader|\bfals[oa])/i;

/** Jurisdiction names that must not appear in any supplied text (the motif stays `jurisdiction: unspecified`). */
export const JURIS = /(united states|\bu\.s\.|\busa\b|federal|england|wales|united kingdom|\buk\b|spain|españa|espanol|mexico|méxico|argentin|chile|colombia|per[uú]\b|california|new york|texas|supreme court|tribunal supremo|ley de enjuiciamiento|\blec\b|federal rules|civil procedure rules|código|codigo|\bcode of)/i;

/** Every supplied text (defaults and presets' params) is free of the banned wording. */
export function bannedDataTest(ID) {
  test(`${ID}: no supplied text (defaults and presets, EN and ES) names an expert-evidence rule, weight, reliability, credibility or an outcome`, async () => {
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
    // (the pattern catches the words the coordinator listed, in both languages; it lets the motif's own words through)
    for (const w of ['admissible', 'admisible', 'perito designado por el tribunal', 'court-appointed expert', 'reliable', 'fiable', 'credible', 'creíble', 'weight', 'valor probatorio', 'Daubert', 'Frye', 'CPR Part 35', 'duties to the court', 'qualified', 'accepted', 'rejected', 'aceptada', 'rechazada', 'the winner', 'correct', 'wrong', 'outcome']) expect(BANNED.test(w), w).toBe(true);
    for (const w of ['Prueba 1: gráfico de lecturas', 'Chart 1: readings A to H (fictional)', 'Measurement (as supplied)', "Specialist's interpretation (as supplied)", 'Interpretación del especialista (aportada)', 'Medición (aportada)', 'As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión', 'Reading of points 4 to 6 (as supplied)']) expect(BANNED.test(w), w).toBe(false);
  });
}

/** The render (every preset, ratio, labels shown, several instants) never shows the banned wording. */
export function bannedRenderTest(ID) {
  test(`${ID}: no rendered text names an expert-evidence rule, weight, reliability, credibility or an outcome (EN and ES)`, async ({page}) => {
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
 * No jurisdiction (coordinator): every supplied text (defaults and presets) is free of jurisdiction names, the
 * jurisdiction control is never set to anything but "unspecified", and the render says so (EN and ES).
 */
export function jurisdictionTest(ID) {
  test(`${ID}: no jurisdiction is named or set; the render says "jurisdiction unspecified" (EN and ES)`, async ({page}) => {
    test.setTimeout(300000);
    const def = (await import(`../../src/animations/hearings/${ID}.js`)).default;
    const all = [{name: 'default', params: def.defaultParams}, ...presetsFor(ID)];
    const bad = [];
    const walk = (v, path, name) => {
      if (typeof v === 'string') { if (JURIS.test(v)) bad.push(`${name} ${path}: "${v}"`); return; }
      if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k], `${path}.${k}`, name);
    };
    for (const pr of all) {
      walk(pr.params, '', pr.name);
      if (pr.params.jurisdiction !== undefined && pr.params.jurisdiction !== 'unspecified') bad.push(`${pr.name}: jurisdiction ${pr.params.jurisdiction}`);
    }
    for (const w of ['Federal Rules of Evidence', 'Ley de Enjuiciamiento Civil', 'England and Wales', 'Tribunal Supremo']) expect(JURIS.test(w), w).toBe(true);
    for (const w of ['Hearing room 7 (fictional)', 'Sala de audiencias 7 (ficticia)', 'Specialist (fictional)']) expect(JURIS.test(w), w).toBe(false);
    const {bad: rb} = await forAll(page, ID, `
      x.seek(x.durationMs);
      // (the notice ribbon is drawn by the core outside the scene's nodes: every <text> of the frame is read)
      const all = [...svg.querySelectorAll('[data-layer="content-notice"] text')].map(t => t.textContent).join(' | ');
      return /jurisdiction unspecified|jurisdicción no especificada/i.test(all) ? [] : [pr.name + ' ' + ratio + ': no "jurisdiction unspecified" in the render'];`, {}, {withHidden: false});
    bad.push(...rb);
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
 * Preset consistency: one measurement and one interpretation; the specialist is a participant; the span lies inside the
 * chart (from <= to <= points); the chart's exhibit exists. Rendered at the hold (every preset and ratio, `prefix` room):
 * the reference tag is shown; the explanation card and the caption are shown exactly when an interpretation is connected.
 */
export function chartConsistencyTest(ID, {rendered = true, prefix = 'rm', u = 1} = {}) {
  test(`${ID}: every preset supplies one measurement, one interpretation and a span inside its chart (rendered at the hold)`, async ({page}) => {
    test.setTimeout(300000);
    const def = (await import(`../../src/animations/hearings/${ID}.js`)).default;
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = [];
    for (const pr of presets) {
      const q = {...def.defaultParams, ...pr.params};
      const n = k => q.statements.filter(s => s.kind === k).length;
      if (n('measurement') !== 1 || n('interpretation') !== 1) bad.push(`${pr.name}: ${n('measurement')} measurement / ${n('interpretation')} interpretation`);
      if (q.specialist >= q.speakers.length) bad.push(`${pr.name}: specialist ${q.specialist} is not a participant`);
      const d = q.chart;
      if (!(d.span.from >= 1 && d.span.from <= d.span.to && d.span.to <= d.points)) bad.push(`${pr.name}: span ${d.span.from}–${d.span.to} outside a ${d.points}-point chart`);
      if (d.exhibit >= q.exhibits.length) bad.push(`${pr.name}: chart exhibit ${d.exhibit} does not exist`);
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
          const want = s.finalState !== 'measurement-only' && s.detailShown !== false;
          const zc = [...svg.querySelectorAll(`[data-node^="${prefix}-zcopy-"]`)].map(op);
          const zShown = zc.some(v => v > 0.95), cap = op(q(`[data-node="${prefix}-cap"]`)) > 0.95;
          if (want !== zShown) out.push(`${tag}: explanation card shown ${zShown} (expected ${want})`);
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
 * tag and in the legend row of the measurement; ◆ (a diamond) on the caption plate and in the interpretation row; the two
 * with the same ink area (`prefix` room; at `at`).
 */
export function glyphStateTest(ID, {prefixes = ['rm'], at = [1]} = {}) {
  test(`${ID}: ● is drawn beside the measurement and ◆ beside the specialist's interpretation, everywhere, with equal ink`, async ({page}) => {
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
        const rd = node(svg, 'lg-measurement'), rt = node(svg, 'lg-interpretation');
        if (rd && kind(rd.querySelector('g')) !== 'dot') out.push(tag + ': the legend row of the measurement is not ●');
        if (rt && kind(rt.querySelector('g')) !== 'diamond') out.push(tag + ': the legend row of the interpretation is not ◆');
      }
      return out;`, {at, prefixes}, {withHidden: true});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * No text is drawn in two places at once (coordinator): at every sampled u (step 0.01), no visible text string appears
 * twice in the frame — a lens copy never stands beside its source.
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
