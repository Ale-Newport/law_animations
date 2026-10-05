// Rendered and data checks for the four "Objeción procesal" entries (LAW-0297..0300, hearings-05). Earlier checks are
// imported read-only; this file adds the motif's own: no grounds / ruling / outcome / hierarchy wording (EN and ES, in
// the supplied data and in the render), every stress text longer than its baseline, preset consistency (one question,
// one intervention, at most one response, four distinct roles) and equal weight for the two seated participants.
import {test, expect} from '@playwright/test';
import {forAll} from './apertura-audiencia-checks.js';
import {presetsFor} from '../harness/contract.js';

/** English words that must not leak into a locale-'es' render (default texts). */
export const ES_WORDS = ['Participant', 'Exhibit', 'Room', 'fictional', 'supplied', 'Sequence', 'Witness', 'witness', 'Questioner', 'Question', 'Signal', 'signal', 'paused', 'Paused', 'Reason', 'Response', 'response', 'Intervention', 'card', 'rail', 'Rail', 'tray', 'lectern', 'Lectern', 'clock', 'configured', 'conclusion', 'Changed', 'Order', 'turn', 'Turn'];

/** People floors (coordinator): >= 60 px off 1:1; >= 55 px at 1:1 for every preset except long-labels-stress (>= 45 px). */
export const FLOOR_FOR = "if (ratio !== '1:1') return 60; return preset.replace(' (labels hidden)', '') === 'long-labels-stress' ? 45 : 55;";

/**
 * Banned wording (EN and ES): grounds rules, ruling outcomes as states, win / lose and hierarchy. The motif only shows
 * a supplied signal, a supplied reason card and a supplied response card; the question stays paused.
 * (Word stems; `win` / `lose` only as whole words, so "window" or "closed" do not match.)
 */
export const BANNED = /(sustain|overrul|\bgrant|\bdenied|\bden(y|ies)\b|deneg|ha lugar|estimad|desestim|admit|admisi|inadmi|exclu|hearsay|o[ií]das|referencia|impertinen|pertinen|\bleading\b|sugestiv|relevan|\bruling|\bruled\b|\bfallo|resoluci|\bdecision|\bdecided|decisi[oó]n|\bwins?\b|winner|ganador|\bganó\b|\blos(e|es|er|t)\b|perdedor|upheld|reject|rechaz|accept|acept|\bvalid|v[aá]lid[oa]|improper|improceden|\bprocedente|\bgrounds?\b|fundament|outcome|resultado|verdict|veredicto|prevail|preval|superior|inferior|jerarq|hierarch|\brank|\bcorrect|incorrect|\berror|\bwrong)/i;

/** Every supplied text (defaults and presets' params) is free of the banned wording. */
export function rulingFreeDataTest(ID) {
  test(`${ID}: no supplied text (defaults and presets, EN and ES) names grounds, a ruling, an outcome, a winner or a hierarchy`, async () => {
    const def = (await import(`../../src/animations/hearings/${ID}.js`)).default;
    const es = presetsFor(ID).find(q => q.name === 'baseline-es');
    const all = [{name: 'default', params: def.defaultParams}, ...presetsFor(ID)];
    if (!es) throw new Error('no baseline-es preset');
    const bad = [];
    const walk = (v, path, name) => {
      if (typeof v === 'string') { if (BANNED.test(v)) bad.push(`${name} ${path}: "${v}"`); return; }
      if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k], `${path}.${k}`, name);
    };
    for (const pr of all) walk(pr.params, '', pr.name);
    expect(bad, bad.join('\n')).toEqual([]);
    // (the pattern itself catches the words the coordinator listed, in both languages)
    for (const w of ['Sustained', 'overruled', 'Granted', 'denied', 'Ha lugar', 'No ha lugar', 'estimada', 'desestimada', 'admitida', 'inadmitida', 'hearsay', 'impertinente', 'Leading', 'relevance', 'excluded', 'the winner', 'you lose']) expect(BANNED.test(w), w).toBe(true);
    for (const w of ['window', 'closed', 'Response as supplied (illustrative)', 'Intervención planteada (según lo aportado)', 'As supplied · no conclusion drawn']) expect(BANNED.test(w), w).toBe(false);
  });
}

/** The render (every preset, ratio, labels shown, several instants) never shows the banned wording. */
export function rulingFreeRenderTest(ID) {
  test(`${ID}: no rendered text names grounds, a ruling, an outcome, a winner or a hierarchy (EN and ES)`, async ({page}) => {
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
 * longer than the same field in the defaults (a field the stress preset leaves out falls back to the default: equal).
 */
export function stressLongerTest(ID) {
  test(`${ID}: long-labels-stress — every text field is strictly longer than its baseline (default) counterpart`, async () => {
    const def = (await import(`../../src/animations/hearings/${ID}.js`)).default;
    const base = def.defaultParams;
    const stress = presetsFor(ID).find(q => q.name === 'long-labels-stress').params;
    // (enumerations, ids and the common controls are not texts; the four roles and the sequence are numbers)
    const ENUMS = new Set(['kind', 'op', 'form', 'beforeState', 'focusTarget', 'focusCard', 'placement', 'id', 'from', 'to', 'locale', 'textVisibility', 'theme', 'palette', 'background', 'jurisdiction', 'aspectRatio', 'instanceId', 'target', 'finalState', 'focusElement', 'traversalOrder', 'hair']);
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
 * Preset consistency: one question, one intervention and at most one response; four distinct roles within the
 * speakers; the sequence names each card once. Rendered at the hold (every preset and ratio): the question is paused
 * and its card never opens; the reason card is open; the response card is open exactly when it is supplied and the
 * final state keeps it; every card's route kept clear of labels, equipment and people.
 */
export function objectionConsistencyTest(ID, {rendered = true, sem = true, prefix = 'rm'} = {}) {
  test(`${ID}: every preset supplies one question, one intervention, at most one response and four distinct roles (rendered at the hold)`, async ({page}) => {
    test.setTimeout(300000);
    const def = (await import(`../../src/animations/hearings/${ID}.js`)).default;
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = [];
    for (const pr of presets) {
      const q = {...def.defaultParams, ...pr.params};
      const sts = q.statements;
      const n = k => sts.filter(s => s.kind === k).length;
      if (n('question') !== 1 || n('intervention') !== 1 || n('response') > 1) bad.push(`${pr.name}: ${n('question')} question / ${n('intervention')} intervention / ${n('response')} response`);
      const roles = [q.questioner, q.witness, q.raiser, q.responder];
      if (new Set(roles).size !== 4 || roles.some(v => v < 0 || v >= q.speakers.length)) bad.push(`${pr.name}: roles ${roles.join(',')} are not four distinct participants`);
      if (new Set(q.sequence).size !== q.sequence.length || q.sequence.some(v => v >= sts.length)) bad.push(`${pr.name}: sequence ${q.sequence.join(',')}`);
    }
    if (rendered) {
      await page.goto('/tests/harness/host.html');
      await page.waitForFunction(() => document.body.dataset.ready === '1');
      const res = await page.evaluate(async ([id, presets, sem, prefix]) => {
        const def = await window.__lib.load(id);
        const out = [];
        for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
          const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: pr.params});
          await x.ready; x.seek(x.durationMs);
          const s = x.getState({bounds: false}).semantic;
          const svg = x.element;
          const op = e => { let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
          const card = i => { const e = svg.querySelector(`[data-node="${prefix}-card${i}"]`); return e ? op(e) : 0; };
          const tag = `${pr.name} ${w}x${h}`;
          if (sem) {
            if (s.paused !== 1) out.push(`${tag}: the question is not paused at the hold`);
            if (s.qI !== null && card(s.qI) > 0.01) out.push(`${tag}: the question card is shown`);
            if (s.intI !== null && card(s.intI) < 0.95) out.push(`${tag}: the reason card is not shown`);
            const wantRes = s.resI !== null && s.finalState !== 'intervention-only';
            if (s.resI !== null && wantRes !== card(s.resI) > 0.95) out.push(`${tag}: response card shown ${card(s.resI)} (expected ${wantRes})`);
            if (s.routesClear === false) out.push(`${tag}: a card route crosses a label, equipment or a person`);
          }
          x.destroy(); el.remove();
        }
        return out;
      }, [ID, presets, sem, prefix]);
      bad.push(...res);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * No hierarchy between the participants who raise and respond: same chair, same figure size, same head size; the
 * reason and response cards have the same type size, stroke and fill (their heights follow the supplied texts).
 */
export function noHierarchyTest(ID, {at = [1], prefix = 'rm'} = {}) {
  test(`${ID}: the participant who raises and the one who responds — and their two cards — get the same visual weight`, async ({page}) => {
    test.setTimeout(300000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      const tag = pr.name + ' ' + ratio;
      for (const u of arg.at) {
        x.seek(u * x.durationMs);
        const s = x.getState({bounds: false}).semantic;
        const R = s.roles; if (!R) { out.push(tag + ': no roles'); continue; }
        const area = sel => { const e = svg.querySelector(sel); if (!e) return null; const b = e.getBBox(); return b.width * b.height; };
        const P0 = arg.prefix;
        for (const [a, b, what] of [['[data-node="' + P0 + '-chair' + R.raiser + '"]', '[data-node="' + P0 + '-chair' + R.responder + '"]', 'chair'], ['[data-node="' + P0 + '-p' + R.raiser + '-head"]', '[data-node="' + P0 + '-p' + R.responder + '-head"]', 'head']]) {
          const A = area(a), B = area(b);
          if (A === null && B === null) continue;
          if (A === null || B === null) { out.push(tag + ': ' + what + ' missing for one of the two'); continue; }
          stat('compared ' + what, 1, 'max');
          if (Math.max(A, B) / Math.max(1e-6, Math.min(A, B)) > 1.05) out.push(tag + ': ' + what + ' sizes ' + A.toFixed(0) + ' vs ' + B.toFixed(0));
        }
        const ca = s.intI !== null ? svg.querySelector('[data-node="' + P0 + '-card' + s.intI + '-body"]') : null;
        const cb = s.resI !== null ? svg.querySelector('[data-node="' + P0 + '-card' + s.resI + '-body"]') : null;
        if (ca && cb && eff(svg, ca) > 0.95 && eff(svg, cb) > 0.95) {
          // (heights follow the supplied texts; the type size, stroke and fill are what must match)
          const fz = e => { const t = e && e.querySelector('text'); return t ? parseFloat(getComputedStyle(t).fontSize) * t.getScreenCTM().a : null; };
          const fa = fz(svg.querySelector('[data-node="' + P0 + '-card' + s.intI + '-text"]')), fb = fz(svg.querySelector('[data-node="' + P0 + '-card' + s.resI + '-text"]'));
          if (fa !== null && fb !== null && Math.abs(fa - fb) > 0.2) out.push(tag + ': card type ' + fa.toFixed(2) + ' vs ' + fb.toFixed(2));
          const pa = ca.querySelector('path, rect'), pb = cb.querySelector('path, rect');
          if (pa && pb && (pa.getAttribute('stroke-width') !== pb.getAttribute('stroke-width') || pa.getAttribute('stroke') !== pb.getAttribute('stroke') || pa.getAttribute('fill') !== pb.getAttribute('fill'))) out.push(tag + ': card stroke / fill differs');
          // ● and ◆ on the two cards: the same ink area (a circle π r², a diamond half its box) and fill
          const ga = svg.querySelector('[data-node="' + P0 + '-card' + s.intI + '-g-open"]'), gb = svg.querySelector('[data-node="' + P0 + '-card' + s.resI + '-g-bounded"]');
          if (ga && gb) {
            const ink = e => { const sh = e.querySelector('circle, path') || e; const q = sh.getBoundingClientRect(); return sh.tagName === 'circle' ? Math.PI * q.width * q.height / 4 : q.width * q.height / 2; };
            const ia = ink(ga), ib = ink(gb);
            if (Math.max(ia, ib) / Math.max(1e-6, Math.min(ia, ib)) > 1.1) out.push(tag + ': card marker ink ' + ia.toFixed(0) + ' vs ' + ib.toFixed(0));
          }
          const ta = svg.querySelector('[data-node="' + P0 + '-card' + s.intI + '-text"] text'), tb = svg.querySelector('[data-node="' + P0 + '-card' + s.resI + '-text"] text');
          if (ta && tb && getComputedStyle(ta).fontWeight !== getComputedStyle(tb).fontWeight) out.push(tag + ': card text weight differs');
        }
      }
      return out;`, {at, prefix}, {withHidden: false});
    expect(bad, bad.join('\n')).toEqual([]);
    // (the comparison actually ran: chairs and heads found)
    expect(stats['compared head'] || 0).toBe(1);
  });
}
