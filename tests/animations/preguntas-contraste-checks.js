// Rendered and data checks for the four "Preguntas de contraste" entries (LAW-0293..0296, hearings-04). Earlier checks
// are imported read-only; this file adds the motif's own: no impeachment / credibility / verdict wording, every stress
// text longer than its baseline, and the supplied difference consistent with the answers (and found in the render).
import {test, expect} from '@playwright/test';
import {forAll} from './apertura-audiencia-checks.js';
import {presetsFor} from '../harness/contract.js';

/** English words that must not leak into a locale-'es' render (default texts). */
export const ES_WORDS = ['Participant', 'Exhibit', 'Room', 'fictional', 'supplied', 'Sequence', 'Witness', 'witness', 'Questioner', 'Question', 'Answer', 'answer', 'Previous', 'Current', 'rail', 'Rail', 'tray', 'lectern', 'Lectern', 'clock', 'configured', 'conclusion', 'Changed', 'Order', 'differ', 'Words', 'turn', 'Turn'];

/** People floors (coordinator): >= 60 px off 1:1; >= 55 px at 1:1 for every preset except long-labels-stress (>= 45 px). */
export const FLOOR_FOR = "if (ratio !== '1:1') return 60; return preset.replace(' (labels hidden)', '') === 'long-labels-stress' ? 45 : 55;";

/**
 * No text states a finding about the two answers or the witness: no inconsistency, contradiction, impeachment,
 * credibility, lie, error, mistake, correction, truth, reliability, weight or outcome — the highlight is only a textual
 * difference between two supplied answers.
 */
export function impeachmentFreeTest(ID) {
  test(`${ID}: no text states an inconsistency, contradiction, credibility, impeachment, lie, error, weight or outcome`, async ({page}) => {
    test.setTimeout(400000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      const re = /(inconsisten|contradict|contradic|incoheren|impeach|credib|cre[ií]ble|\\blie\\b|\\blies\\b|lying|liar|mient|mentir|\\berror|mistak|equivoc|wrong|incorrect|correct(ion|ed|o|a)?\\b|correg|rectific|\\btrue\\b|\\bfalse\\b|verdad|fals[oa]|reliab|fiab|weight|\\bpeso\\b|suspicious|sospech|discrepan|conflict|admissib|admisib|objection|objeci)/i;
      for (const u of [0, 0.3, 0.6, 0.8, 1]) {
        x.seek(u * x.durationMs);
        for (const t of texts(svg, 0.05)) if (re.test(t.textContent)) out.push(pr.name + ' ' + ratio + ': "' + t.textContent.slice(0, 50) + '"');
      }
      return [...new Set(out)];`, {}, {withHidden: false});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Stress strictly longer than baseline (coordinator, AUTHORING item 20): every supplied text of long-labels-stress is
 * longer than the same field in the defaults (a field the stress preset leaves out falls back to the default: equal).
 */
export function stressLongerTest(ID) {
  test(`${ID}: long-labels-stress — every text field is strictly longer than its baseline (default) counterpart`, async () => {
    const def = (await import(`../../src/animations/hearings/${ID}.js`)).default;
    const base = def.defaultParams;
    const stress = presetsFor(ID).find(q => q.name === 'long-labels-stress').params;
    // (enumerations, ids and the common controls are not texts)
    const ENUMS = new Set(['kind', 'source', 'form', 'beforeState', 'focusTarget', 'placement', 'id', 'from', 'to', 'locale', 'textVisibility', 'theme', 'palette', 'background', 'jurisdiction', 'aspectRatio', 'instanceId', 'target', 'finalState', 'focusElement', 'traversalOrder']);
    const bad = [];
    const walk = (d, s0, path) => {
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
 * Preset consistency: exactly one previous and one current answer; the supplied differing words appear in each answer
 * (previous words in the previous answer, current words in the current one) and differ; rendered, the highlight is drawn
 * in both cards at the hold (labels shown).
 * @param {string} ID
 * @param {{defaults:any, rendered?:boolean, sem?:string}} o
 */
export function differenceConsistencyTest(ID, {defaults, rendered = true} = {}) {
  test(`${ID}: every preset supplies one previous and one current answer, and the marked words appear in each (rendered in both)`, async ({page}) => {
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = [];
    for (const pr of presets) {
      const q = {...defaults, ...pr.params};
      const sts = q.statements;
      const prev = sts.filter(s => s.kind === 'previous'), cur = sts.filter(s => s.kind === 'current');
      if (prev.length !== 1 || cur.length !== 1) bad.push(`${pr.name}: ${prev.length} previous / ${cur.length} current answers`);
      if (prev[0] && !prev[0].text.includes(q.difference.previous)) bad.push(`${pr.name}: "${q.difference.previous}" not in the previous answer "${prev[0].text}"`);
      if (cur[0] && !cur[0].text.includes(q.difference.current)) bad.push(`${pr.name}: "${q.difference.current}" not in the current answer "${cur[0].text}"`);
      if (q.difference.previous === q.difference.current) bad.push(`${pr.name}: the marked words are the same`);
    }
    if (rendered) {
      await page.goto('/tests/harness/host.html');
      await page.waitForFunction(() => document.body.dataset.ready === '1');
      const res = await page.evaluate(async ([id, presets]) => {
        const def = await window.__lib.load(id);
        const out = [];
        for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
          const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: pr.params});
          await x.ready; x.seek(x.durationMs);
          const svg = x.element;
          const op = e => { let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
          const hs = [...svg.querySelectorAll('[data-node$="hl-prev"], [data-node$="hl-cur"]')];
          const vis = hs.filter(e => op(e) > 0.95 && e.getBoundingClientRect().width > 2);
          const fs = x.getState({bounds: false}).semantic.finalState;
          if (fs !== 'aligned-only' && vis.length % 2 !== 0) out.push(`${pr.name} ${w}x${h}: ${vis.length} highlights (they come in equal pairs)`);
          if (fs !== 'aligned-only' && vis.length === 0) out.push(`${pr.name} ${w}x${h}: no highlight drawn`);
          x.destroy(); el.remove();
        }
        return out;
      }, [ID, presets]);
      bad.push(...res);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
}
