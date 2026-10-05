// Rendered and data checks for the four "Identificación de motivo" entries (LAW-0321..0324, review-01 / hearings-11),
// copied from ./lectura-resolucion-checks.js (hearings-10; that file stays unchanged) and adapted. Legal risk is VERY HIGH
// (grounds of a challenge): the decision carries ONLY supplied placeholder text and the two labels are neutral labels
// supplied by the party, so these checks forbid, in EN and ES, any appeal rule or evaluation — error / erróneo, wrong,
// incorrect / incorrecto, infringement / infracción, vulnera, admissible / admisible, plazo / deadline, recurso de casación,
// apelación, standard of review, reversed / revocada, upheld / confirmada, must / debe, valid / válido, outcome /
// resultado, wins / gana and the other decision words of hearings-10 — in the supplied data and in the render; "impugnar"
// / "challenge" appear only as "se pretende impugnar (según lo aportado)" / "intends to challenge (as supplied)"; no
// jurisdiction named anywhere (and the render says "jurisdiction unspecified"); every stress text longer than its baseline
// and every stress list at least as long (nested counts); preset consistency (one label per side, a valid examiner, valid
// routes, equal counts); the glyph follows the side (● only on A, ◆ only on B, equal ink); no text drawn twice; the es
// defaults carry "(aportado/a)" or "(según lo aportado)" wherever the en ones carry "(as supplied)"; nobody but the
// examiner moves, and the examiner only along the table's edge; every line is anchored to its own card's lower edge and
// lands on its own apartado's upper edge at every u.
import {test, expect} from '@playwright/test';
import {forAll, report, HELPERS} from './apertura-audiencia-checks.js';
import {presetsFor} from '../harness/contract.js';

/** English words that must not leak into a locale-'es' render (default texts). */
export const ES_WORDS = ['Party', 'Participant', 'Section', 'Sections', 'section', 'Decision', 'decision', 'examination', 'fictional', 'supplied', 'Factual', 'discrepancy', 'Legal', 'question', 'raised', 'Labelled', 'label', 'labels', 'magnifier', 'Magnifier', 'board', 'Board', 'table', 'Table', 'Wall', 'calendar', 'configured', 'conclusion', 'Changed', 'was', 'linked', 'Located', 'located', 'Order', 'Each', 'Card', 'Neither', 'The', 'On', 'In', 'the', 'and', 'with'];

/** People floors (coordinator; hearings measure the rendered FIGURE): >= 60 px off 1:1; >= 55 px at 1:1 for every
 * preset except long-labels-stress (>= 45 px). */
export const FLOOR_FOR = "if (ratio !== '1:1') return 60; return preset.replace(' (labels hidden)', '') === 'long-labels-stress' ? 45 : 55;";

/**
 * Banned wording (EN and ES): any content of a decision — a ruling or outcome (estimada / estimamos / desestimada,
 * granted, dismissed, upheld, allowed, sustained, rejected, condena / condenado, absuelto / absolución, convicted,
 * acquitted, fallo / fall(a/ó) as an outcome, verdict, judgment, ruling, wins / gana / ganador, loses / pierde, prevails),
 * liability (liable / liability / responsable / responsabilidad), costs (costas / costs), finality (firme / final /
 * definitive), any appeal (appeal / recurso / recurrir / apelación), time limits (plazo / deadline / time limit), duties
 * (must / debe / required / obligatorio), validity (valid / válido / invalid), payment or damages, reasons or a legal test
 * (reasons for, motivo, legal test, criterion, standard), guilt, an order to do something, and institutions (judge, court,
 * law). The motif only shows a document separating into supplied placeholder sections and paragraphs.
 */
export const BANNED = /(\berror|err[oó]ne|\bwrong|incorrect|infring|infracci|vulner|admissib|admisib|inadmis|casaci|standard of review|est[aá]ndar de revisi|revers|revocad|revoca\b|\bconfirmad|\bconfirma\b|\bvalid|v[aá]lid|nulidad|\bvoid\b|estimad[oa]s?|estimamos|\bestima\b|desestim|\bgrant(s|ed|ing)?\b|dismiss|\bupheld\b|\buphold|\ballow(s|ed|ing)?\b|\bsustain|\breject|rechaz|condena|condenad|absuel|absoluci|absolv|convict|acquit|\bfallo\b|\bfall[aó]\b|verdict|veredicto|judgment|judgement|\bruling|\bruled?\b|sentenc|\bwins?\b|winner|ganador|\bgana\b|\bganó\b|\blos(e|es|er)\b|pierde|perdedor|prevail|prevalec|liabl|liabilit|responsab|costas|\bcosts?\b|\bfirme\b|\bfinal\b|definitiv|appeal|recurs|recurr|apelaci|\bplazo|deadline|time limit|l[ií]mite de tiempo|\bmust\b|\bdebe|deber[aá]|required|obligatori|mandator|\bvalid|v[aá]lid[oa]|invalid|\bpay\b|\bpaid\b|pagar|indemn|damages|da[nñ]os y perjuicios|reasons? for|\bmotivo|legal test|criteri|\bstandard|\bguilt|culpab|innocen|inocen|ordered to|condenado a|outcome|resultado|decided|decide que|judge|\bjuez|magistrad|\bcourt\b|tribunal|\blaw\b|\bley\b|jurisprud|binding|vinculante|enforce|ejecutor|in favou?r|a favor de|en contra de|against)/i;

/** Jurisdiction names that must not appear in any supplied text (the motif stays `jurisdiction: unspecified`). */
export const JURIS = /(united states|\bu\.s\.|\busa\b|federal|england|wales|united kingdom|\buk\b|spain|españa|espanol|mexico|méxico|argentin|chile|colombia|per[uú]\b|california|new york|texas|supreme court|tribunal supremo|ley de enjuiciamiento|\blec\b|federal rules|civil procedure rules|código|codigo|\bcode of)/i;

/**
 * "impugnar" / "challenge" only as the party's supplied intention: "se pretende impugnar" with "según lo aportado", or
 * "intends to challenge" with "as supplied" — never as a result.
 */
export const challengeOk = v => {
  const t = String(v);
  if (/impugn/i.test(t) && !(/se pretende impugnar/i.test(t) && /según lo aportado/i.test(t)) && !/^impugnar$/i.test(t)) return false;
  if (/challeng/i.test(t) && !(/intends? to challenge/i.test(t) && /as supplied/i.test(t))) return false;
  return true;
};

const walkStrings = (v, path, fn) => {
  if (typeof v === 'string') { fn(v, path); return; }
  if (v && typeof v === 'object') for (const k of Object.keys(v)) walkStrings(v[k], `${path}.${k}`, fn);
};

/** Every supplied text (defaults and presets) is free of the banned wording (EN and ES). */
export function bannedDataTest(ID) {
  test(`${ID}: no supplied text (defaults and presets, EN and ES) carries decision content: no ruling, outcome, liability, costs, finality, appeal, time limit, duty or validity`, async () => {
    const def = (await import(`../../src/animations/review/${ID}.js`)).default;
    if (!presetsFor(ID).find(q => q.name === 'baseline-es')) throw new Error('no baseline-es preset');
    const all = [{name: 'default', params: def.defaultParams}, ...presetsFor(ID)];
    const bad = [];
    for (const pr of all) walkStrings(pr.params, '', (v, path) => { if (BANNED.test(v)) bad.push(`${pr.name} ${path}: "${v}"`); });
    expect(bad, bad.join('\n')).toEqual([]);
    // (the pattern catches the words the coordinator listed, in both languages; it lets the motif's own words through)
    for (const w of ['la demanda es estimada', 'estimamos el recurso', 'queda desestimada', 'the claim is granted', 'the case was dismissed', 'the decision is upheld', 'the appeal is allowed', 'se condena al demandado', 'condenado en costas', 'resulta absuelto', 'el fallo', 'party B is liable', 'es responsable', 'costs follow', 'la sentencia es firme', 'the final order', 'cabe recurso', 'an appeal lies', 'plazo de veinte días', 'deadline', 'must pay', 'debe pagar', 'a valid contract', 'party A wins', 'gana la parte B']) expect(BANNED.test(w), w).toBe(true);
    for (const w of ['la sentencia contiene un error', 'the finding is wrong', 'an incorrect reading', 'apartado incorrecto', 'infringement of a rule', 'infracción de norma', 'vulnera un derecho', 'the ground is admissible', 'motivo admisible', 'recurso de casación', 'apelación', 'standard of review', 'the decision was reversed', 'resolución revocada', 'the decision is upheld', 'sentencia confirmada', 'a valid ground', 'motivo válido', 'the outcome', 'el resultado', 'party A wins', 'gana la parte B', 'el tribunal debe']) expect(BANNED.test(w), w).toBe(true);
    for (const w of ['Factual discrepancy (as supplied)', 'Legal question raised (as supplied)', 'Discrepancia fáctica (según lo aportado)', 'Cuestión jurídica señalada (según lo aportado)', 'Apartado 3 (texto aportado)', 'Section 3 (supplied text)', 'Labelled a factual discrepancy (as supplied)', 'Etiquetado como cuestión jurídica señalada (según lo aportado)', 'As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión', 'Order of the labels as configured (illustrative)', 'Orden de las etiquetas según lo configurado (ilustrativo)', 'The magnifier located the sections the party intends to challenge (as supplied)', 'La lupa localizó los apartados que se pretende impugnar (según lo aportado)', 'Party with the magnifier (fictional)', 'Parte con la lupa (ficticia)', 'Resolución examinada (ficticia)', 'Apartado localizado (según lo aportado)', 'Calendario de pared (sin fechas marcadas)']) expect(BANNED.test(w), w).toBe(false);
    // ("impugnar" / "challenge" only as the party's supplied intention, never as an outcome)
    const loose = [];
    for (const pr of all) walkStrings(pr.params, '', (v, path) => { if (!challengeOk(v)) loose.push(`${pr.name} ${path}: "${v}"`); });
    expect(loose, loose.join('\n')).toEqual([]);
    for (const w of ['the section was challenged', 'se impugnó el apartado', 'impugnación estimada', 'challenge succeeds']) expect(challengeOk(w), w).toBe(false);
  });
}

/** The render (every preset, ratio, labels shown, several instants, plus an es-only render) never shows the banned wording. */
export function bannedRenderTest(ID) {
  test(`${ID}: no rendered text carries decision content — ruling, outcome, liability, costs, finality, appeal, time limit, duty, validity (EN and ES)`, async ({page}) => {
    test.setTimeout(400000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      const re = new RegExp(arg.re, 'i');
      for (const u of [0, 0.3, 0.6, 0.8, 1]) {
        x.seek(u * x.durationMs);
        for (const t of texts(svg, 0.05)) {
          const s = (t.querySelectorAll('tspan').length ? [...t.querySelectorAll('tspan')].map(q => q.textContent).join(' ') : (t.textContent || '')).replace(/\\s+/g, ' ');
          if (re.test(s)) out.push(pr.name + ' ' + ratio + ': "' + s.slice(0, 50) + '"');
          if (/impugn/i.test(s) && !(/se pretende impugnar/i.test(s) && /según lo aportado/i.test(s))) out.push(pr.name + ' ' + ratio + ': loose "impugnar": "' + s.slice(0, 60) + '"');
          if (/challeng/i.test(s) && !(/intends? to challenge/i.test(s) && /as supplied/i.test(s))) out.push(pr.name + ' ' + ratio + ': loose "challenge": "' + s.slice(0, 60) + '"');
        }
      }
      return [...new Set(out)];`, {re: BANNED.source}, {withHidden: false});
    const {bad: es} = await forAll(page, ID, `
      const out = [];
      const re = new RegExp(arg.re, 'i');
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const y = (await window.__lib.load(arg.id)).create(el, {width: w, height: h, params: {locale: 'es'}});
      await y.ready;
      for (const u of [0, 0.5, 1]) { y.seek(u * y.durationMs); for (const t of texts(y.element, 0.05)) if (re.test(t.textContent)) out.push('es-only ' + ratio + ': "' + t.textContent.slice(0, 50) + '"'); }
      y.destroy(); el.remove();
      return [...new Set(out)];`, {re: BANNED.source, id: ID}, {withHidden: false, presets: ['default']});
    bad.push(...es);
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
    const def = (await import(`../../src/animations/review/${ID}.js`)).default;
    const all = [{name: 'default', params: def.defaultParams}, ...presetsFor(ID)];
    const bad = [];
    for (const pr of all) {
      walkStrings(pr.params, '', (v, path) => { if (JURIS.test(v)) bad.push(`${pr.name} ${path}: "${v}"`); });
      if (pr.params.jurisdiction !== undefined && pr.params.jurisdiction !== 'unspecified') bad.push(`${pr.name}: jurisdiction ${pr.params.jurisdiction}`);
    }
    for (const w of ['Federal Rules of Civil Procedure', 'Ley de Enjuiciamiento Civil', 'England and Wales', 'Tribunal Supremo']) expect(JURIS.test(w), w).toBe(true);
    for (const w of ['Decision under examination (fictional)', 'Resolución examinada (ficticia)', 'Cuestión jurídica señalada (según lo aportado)']) expect(JURIS.test(w), w).toBe(false);
    const {bad: rb} = await forAll(page, ID, `
      x.seek(x.durationMs);
      const all = [...svg.querySelectorAll('[data-layer="content-notice"] text')].map(t => t.textContent).join(' | ');
      return /jurisdiction unspecified|jurisdicción no especificada/i.test(all) ? [] : [pr.name + ' ' + ratio + ': no "jurisdiction unspecified" in the render'];`, {}, {withHidden: false});
    bad.push(...rb);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Stress strictly longer than baseline (coordinator, AUTHORING item 20): every supplied text of long-labels-stress is
 * longer than the same field in the defaults, and every list (nested lists included) holds at least as many entries.
 */
export function stressLongerTest(ID) {
  test(`${ID}: long-labels-stress — every text field is strictly longer than its baseline counterpart, every list (nested too) at least as long`, async () => {
    const def = (await import(`../../src/animations/review/${ID}.js`)).default;
    const base = def.defaultParams;
    const stress = presetsFor(ID).find(q => q.name === 'long-labels-stress').params;
    const ENUMS = new Set(['kind', 'side', 'focusTarget', 'focusElement', 'placement', 'id', 'from', 'to', 'locale', 'textVisibility', 'theme', 'palette', 'background', 'jurisdiction', 'aspectRatio', 'instanceId', 'target', 'finalState', 'traversalOrder', 'hair']);
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
 * The es defaults carry "(aportado/a)" wherever the en defaults carry "(as supplied)" (same field path, defaults vs the
 * baseline-es preset, which mirrors the es defaults).
 */
export function esSuppliedTagTest(ID) {
  test(`${ID}: every es default text carries "(aportado/a/os/as)" or "(según lo aportado)" where the en default carries "(as supplied)"`, async () => {
    const def = (await import(`../../src/animations/review/${ID}.js`)).default;
    const es = presetsFor(ID).find(q => q.name === 'baseline-es').params;
    const bad = [];
    let n = 0;
    walkStrings(def.defaultParams, '', (v, path) => {
      if (!/as supplied/i.test(v)) return;
      const q = path.split('.').slice(1).reduce((o, k) => (o == null ? o : o[k]), es);
      n++;
      if (typeof q !== 'string') bad.push(`${path}: no es text`);
      else if (!/aportad[oa]s?/i.test(q)) bad.push(`${path}: "${q}" lacks (aportado/a)`);
    });
    expect(n).toBeGreaterThan(2);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Preset consistency: one section per side; a valid reader; every line names a paragraph, once; the sequence is valid;
 * both sections hold the same number of paragraphs in every shipped preset (equal weight).
 */
export function imConsistencyTest(ID, {linksOf = q => q.routes, tag = ''} = {}) {
  test(`${ID}: every preset supplies one label per side, a valid examiner, valid routes and equal counts${tag}`, async () => {
    const def = (await import(`../../src/animations/review/${ID}.js`)).default;
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = [];
    for (const pr of presets) {
      const q = {...def.defaultParams, ...pr.params};
      const n = s => q.grounds.filter(st => st.side === s).length;
      if (n('a') !== 1 || n('b') !== 1) bad.push(`${pr.name}: ${n('a')} A / ${n('b')} B labels`);
      if (!(q.examiner >= 0 && q.examiner < q.speakers.length)) bad.push(`${pr.name}: examiner ${q.examiner}`);
      const L = linksOf(q);
      for (const s of ['a', 'b']) {
        if (!L[s].length || new Set(L[s]).size !== L[s].length || L[s].some(v => v >= q.decisions.sections.length)) bad.push(`${pr.name}: links ${s} ${L[s].join(',')}`);
      }
      if (L.a.length !== L.b.length) bad.push(`${pr.name}: ${L.a.length} lines for A vs ${L.b.length} for B`);
      if (new Set(q.sequence).size !== q.sequence.length || q.sequence.some(v => v > 1)) bad.push(`${pr.name}: sequence ${q.sequence.join(',')}`);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * The glyph follows the side, everywhere it is drawn (u 0–1, step 0.05; every preset × ratio × labels, es-only too):
 * ● only on A's card, A's reference plate and A's link markers, ◆ only on B's; the legend rows of A and B carry ● and
 * ◆; a visible ● and ◆ of the same role (cards, link markers) have the same ink area (±12 %).
 */
export function glyphSideTest(ID, {prefixes = ['rm']} = {}) {
  test(`${ID}: ● marks only side A and ◆ only side B, everywhere, with equal ink (every preset × ratio × labels, es-only too)`, async ({page}) => {
    test.setTimeout(600000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, {name: 'es-only', params: {locale: 'es'}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets, prefixes, helpers]) => {
      const H = new Function(`${helpers}; return {eff, node, nodes, box};`)();
      const def = await window.__lib.load(id);
      const out = [];
      const kind = e => (e.tagName === 'circle' ? 'dot' : e.tagName === 'path' ? 'diamond' : (e.querySelector('circle') ? 'dot' : 'diamond'));
      const ink = e => { const q = H.box(e); return e.tagName === 'circle' ? Math.PI * q.w * q.h / 4 : q.w * q.h / 2; };
      for (const pr of presets) for (const tv of [null, 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: tv ? {...pr.params, textVisibility: tv} : pr.params});
        await x.ready;
        const svg = x.element;
        const tag = pr.name + (tv ? ' (labels hidden)' : '') + ' ' + ratio;
        for (let u = 0; u <= 1.0001; u += 0.05) {
          x.seek(u * x.durationMs);
          for (const P of prefixes) {
            const gl = H.nodes(svg, new RegExp('^' + P + '-(card-[ab]-g|refs-[ab]-g|link-[ab]\\\\d+-g)$')).filter(e => H.eff(svg, e) > 0.05);
            for (const e of gl) {
              const nm = e.getAttribute('data-node');
              const side = /-(?:card|refs)-([ab])-g$/.exec(nm)?.[1] || /-link-([ab])\d+-g$/.exec(nm)?.[1];
              const want = side === 'a' ? 'dot' : 'diamond';
              if (kind(e) !== want) out.push(tag + ' u=' + u.toFixed(2) + ': ' + nm + ' is ' + kind(e));
            }
            for (const role of ['card', 'link']) {
              const A = gl.filter(e => new RegExp('-' + role + '-a\\\\d*-g$').test(e.getAttribute('data-node')));
              const B = gl.filter(e => new RegExp('-' + role + '-b\\\\d*-g$').test(e.getAttribute('data-node')));
              for (const a of A) for (const b of B) { if (H.eff(svg, a) < 0.95 || H.eff(svg, b) < 0.95) continue; const ia = ink(a), ib = ink(b); if (Math.max(ia, ib) / Math.max(1e-6, Math.min(ia, ib)) > 1.12) out.push(tag + ' u=' + u.toFixed(2) + ': ' + role + ' ink ' + ia.toFixed(0) + ' vs ' + ib.toFixed(0)); }
            }
          }
          const ra = H.node(svg, 'lg-a'), rb = H.node(svg, 'lg-b');
          // (a legend row of A carries a ● — alone or on its card glyph —, B's a ◆; never the other)
          const has = (row, k) => [...row.querySelectorAll('circle, path')].some(e => (k === 'dot' ? e.tagName === 'circle' && !e.getAttribute('stroke') : e.tagName === 'path' && /^M[^H]*L[^H]*L[^H]*L[^H]*Z$/.test(e.getAttribute('d') || '')));
          if (ra && (!has(ra, 'dot') || has(ra, 'diamond'))) out.push(tag + ': the legend row of A is not ●');
          if (rb && (!has(rb, 'diamond') || has(rb, 'dot'))) out.push(tag + ': the legend row of B is not ◆');
        }
        x.destroy(); el.remove();
      }
      return [...new Set(out)].slice(0, 30);
    }, [ID, presets, prefixes, HELPERS]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/** No text is drawn in two places at once (step 0.01): a lens copy never stands beside its source. */
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

/**
 * Everybody keeps their place (rendered, 60 fps over the whole timeline, every preset × ratio × labels): each person's
 * head centre stays within 1.5 px of where it stood at u = 0, relative to its room's walls (a stepping-back context in
 * the inspect entry is followed). Only arms move.
 */
export function placesKeptTest(ID, {rooms = ['rm'], maxMove = 1.5, step = 1000 / 60, walker = false} = {}) {
  test(`${ID}: ${walker ? 'only the examiner walks, and only along the table\'s edge' : 'nobody walks'} — every other head stays in place relative to its room (60 fps; ${rooms.join(', ')})`, async ({page}) => {
    test.setTimeout(900000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      const tag = pr.name + ' ' + ratio;
      const k = svg.getScreenCTM().a;
      for (const P of arg.rooms) {
        const walls = node(svg, P + '-walls');
        if (!walls) continue;
        const heads = nodes(svg, new RegExp('^' + P + '-p\\\\d-head$'));
        const rel = e => { const W0 = walls.getBoundingClientRect(); const c = headCircle(e); return {x: (c.x - W0.left) / W0.width, y: (c.y - W0.top) / W0.height}; };
        x.seek(0);
        const h0 = heads.map(rel);
        // (the examiner — semantic.reader — may walk, but only sideways along the table's lower edge, continuously)
        const ex = arg.walker ? x.getState({bounds: false}).semantic.reader : -1;
        let worst = 0, worstY = 0, step = 0, prev = null;
        for (let ms = 0; ms <= x.durationMs + 1e-6; ms += arg.step) {
          x.seek(ms);
          const W1 = walls.getBoundingClientRect();
          heads.forEach((e, i) => {
            const q = rel(e);
            const nm = e.getAttribute('data-node');
            if (nm === P + '-p' + ex + '-head') {
              worstY = Math.max(worstY, Math.abs(q.y - h0[i].y) * W1.height / k);
              if (prev) step = Math.max(step, Math.abs(q.x - prev.x) * W1.width / k);
              prev = q;
              return;
            }
            worst = Math.max(worst, Math.hypot((q.x - h0[i].x) * W1.width, (q.y - h0[i].y) * W1.height) / k);
          });
        }
        stat('worst head drift px ' + ratio, Math.round(worst * 100) / 100, 'max');
        if (worst > arg.maxMove) out.push(tag + ' ' + P + ': a participant moved ' + worst.toFixed(2) + ' px');
        if (worstY > arg.maxMove) out.push(tag + ' ' + P + ': the examiner left the table edge by ' + worstY.toFixed(2) + ' px');
        if (step > 40) out.push(tag + ' ' + P + ': the examiner jumped ' + step.toFixed(1) + ' px in one frame');
      }
      return out;`, {rooms, maxMove, step, walker}, {withHidden: true});
    report(ID, 'places kept', stats);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Connectors land (rendered, every preset × ratio × labels, u step 0.02): every visible link starts ON its own card's
 * lower edge (inside the card's width, within 2 px of the edge) and, once fully drawn, its marker sits on its own
 * exhibit's upper edge (inside the exhibit's width, just above its edge); the start dot sits on the line's start.
 * `cardOf(prefix, side)` / exhibit nodes follow the kit's names; contrast rooms carry their own prefixes.
 */
export function linksAnchoredTest(ID, {rooms = ['rm'], step = 0.02} = {}) {
  test(`${ID}: every link starts on its own card's lower edge and lands on its own exhibit's upper edge at every u (step ${step})`, async ({page}) => {
    test.setTimeout(900000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      const tag = pr.name + ' ' + ratio;
      let n = 0;
      for (let u = 0; u <= 1.0001; u += arg.step) {
        x.seek(u * x.durationMs);
        for (const P of arg.rooms) {
          for (const ln of nodes(svg, new RegExp('^' + P + '-link-[ab]\\\\d+$'))) {
            if (eff(svg, ln) < 0.05) continue;
            const nm = ln.getAttribute('data-node');
            const side = nm.slice(P.length + 6, P.length + 7);
            const card = node(svg, P + '-card-' + side + '-body');
            if (!card || eff(svg, card) < 0.05) { out.push(tag + ' u=' + u.toFixed(2) + ': ' + nm + ' without its card'); continue; }
            const m = ln.getScreenCTM();
            const p0 = ln.getPointAtLength(0), pL = ln.getPointAtLength(ln.getTotalLength());
            const A = new DOMPoint(p0.x, p0.y).matrixTransform(m), B = new DOMPoint(pL.x, pL.y).matrixTransform(m);
            const C = box(card);
            n++;
            if (A.x < C.l + 2 || A.x > C.r - 2 || Math.abs(A.y - C.b) > 2.5) out.push(tag + ' u=' + u.toFixed(2) + ': ' + nm + ' starts off its card (' + A.x.toFixed(0) + ',' + A.y.toFixed(0) + ' vs card ' + C.l.toFixed(0) + '–' + C.r.toFixed(0) + ' @' + C.b.toFixed(0) + ')');
            const dot = node(svg, nm + '-s');
            if (dot) { const d = box(dot); if (Math.hypot((d.l + d.r) / 2 - A.x, (d.t + d.b) / 2 - A.y) > 1.5) out.push(tag + ' u=' + u.toFixed(2) + ': ' + nm + ' start dot off the line'); }
            const mk = node(svg, nm + '-m');
            if (mk && eff(svg, mk) > 0.05) { const q = box(mk); if (Math.hypot((q.l + q.r) / 2 - B.x, (q.t + q.b) / 2 - B.y) > 1.5) out.push(tag + ' u=' + u.toFixed(2) + ': ' + nm + ' marker off the tip'); }
            const ex = ln.getAttribute('data-ex');
            const full = ln.getAttribute('data-full') === '1';
            if (full && ex !== null && ex !== '') {
              const E = box(node(svg, P + '-exhibit' + ex));
              const mr = mk ? (box(mk).h / 2) : 0;
              if (B.x < E.l + 1 || B.x > E.r - 1 || B.y > E.t + 1 || B.y < E.t - mr - 8) out.push(tag + ' u=' + u.toFixed(2) + ': ' + nm + ' does not land on exhibit ' + ex + ' (' + B.x.toFixed(0) + ',' + B.y.toFixed(0) + ' vs ' + E.l.toFixed(0) + '–' + E.r.toFixed(0) + ' @' + E.t.toFixed(0) + ')');
            }
          }
        }
      }
      stat('links checked ' + ratio, n, 'max');
      return [...new Set(out)].slice(0, 20);`, {rooms, step}, {withHidden: true});
    report(ID, 'links anchored', stats);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * A number never splits from its unit (rendered, hearings-09 fix, 2026-10-05): in every preset (plus an es-only render)
 * × ratio, labels shown, at u = 0, 0.1 … 1, no wrapped text has a line that ends with a number while the next line starts
 * with its unit ("2 / m", "5 / %", "10 / min"), and no line is a lone unit.
 */
export function gluedNumbersTest(ID, {step = 0.1} = {}) {
  test(`${ID}: no number is torn from its unit, in any preset × ratio (es-only too), at every u (step ${step})`, async ({page}) => {
    test.setTimeout(900000);
    const SRC = `
      const out = [];
      const UNIT = '(mm|cm|m|km|m²|km²|ha|mg|g|kg|t|ml|l|s|min|h|d|%|‰|°C|°|€|\\\\$|£)';
      const torn = (a, b) => /\\d$/.test(a) && new RegExp('^' + UNIT + '(?=[\\\\s,.;:)]|$)').test(b);
      const lone = l => new RegExp('^' + UNIT + '$').test(l);
      const check = (y, tag) => {
        for (let u = 0; u <= 1.0001; u += arg.step) {
          y.seek(u * y.durationMs);
          for (const t of texts(y.element, 0.15)) {
            const L = [...t.querySelectorAll('tspan')].map(q => (q.textContent || '').replace(/\\s+/g, ' ').trim()).filter(Boolean);
            if (L.length < 2) continue;
            for (let i = 0; i < L.length - 1; i++) if (torn(L[i], L[i + 1])) out.push(tag + ' u=' + u.toFixed(1) + ': "' + L[i] + ' / ' + L[i + 1] + '"');
            for (const l of L) if (lone(l)) out.push(tag + ' u=' + u.toFixed(1) + ': lone unit "' + l + '" in "' + L.join(' / ') + '"');
          }
        }
      };
      check(x, pr.name + ' ' + ratio);
      if (pr.name === 'default') {
        const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
        const y = (await window.__lib.load(arg.id)).create(el, {width: w, height: h, params: {locale: 'es'}});
        await y.ready;
        check(y, 'es-only ' + ratio);
        y.destroy(); el.remove();
      }
      return [...new Set(out)].slice(0, 20);`;
    const {bad} = await forAll(page, ID, SRC, {step, id: ID}, {withHidden: false});
    expect(bad, bad.join('\n')).toEqual([]);
    // (the glue itself: the motif's wrap path keeps these groups whole)
    const {imGlue} = await import('../../src/animations/review/kits/identificacion-motivo.js');
    for (const [s, keep] of [['the fence stood 2 m inside the plot', '2\u00a0m'], ['a gap of 5 % here', '5\u00a0%'], ['about 10 min later', '10\u00a0min'], ['Apartado 3 (texto aportado)', 'Apartado\u00a03'], ['Section 2 (supplied text)', 'Section\u00a02']]) expect(imGlue(s).includes(keep), `${s} keeps "${keep}"`).toBe(true);
  });
}

/**
 * No visible multi-line text holds a one-word line (rendered: every preset × ratio, labels shown, u = 0.2 … 1): labels,
 * captions and cards wrap without a widow.
 */
export function noOneWordLineTest(ID, {at = [0.2, 0.4, 0.6, 0.8, 1]} = {}) {
  test(`${ID}: no wrapped text has a one-word line, in any preset × ratio`, async ({page}) => {
    test.setTimeout(600000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      for (const u of arg.at) {
        x.seek(u * x.durationMs);
        for (const t of texts(svg, 0.15)) {
          const L = [...t.querySelectorAll('tspan')].map(q => (q.textContent || '').replace(/\\s+/g, ' ').trim()).filter(Boolean);
          if (L.length < 2) continue;
          for (const l of L) if (!/\\s/.test(l)) out.push(pr.name + ' ' + ratio + ' u=' + u + ': one-word line "' + l + '" in "' + L.join(' / ') + '"');
        }
      }
      return [...new Set(out)].slice(0, 20);`, {at}, {withHidden: false});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Equal weight of the annotations (hearings-09 fix, 2026-10-05): no note may single out one side. In the data, no
 * annotation of the defaults or of any preset targets one side's element, and the schema offers no such target; in the
 * render (every preset × ratio, at the hold), every ring drawn for a note either rings both argument cards alike — as
 * many rings on A's card as on B's — or neither.
 */
export function noOneSideHighlightTest(ID) {
  test(`${ID}: no annotation, ring or highlight targets one side alone (data, schema and render)`, async ({page}) => {
    test.setTimeout(400000);
    const def = (await import(`../../src/animations/review/${ID}.js`)).default;
    const oneSide = t => /(^|-)(a|b)$/.test(String(t)) || /section-[ab]|argument-[ab]|party-[ab]/.test(String(t));
    const data = [];
    for (const pr of [{name: 'default', params: def.defaultParams}, ...presetsFor(ID)]) for (const a of pr.params.annotations || []) if (oneSide(a.target)) data.push(`${pr.name}: note on "${a.target}"`);
    const an = def.paramsSchema && def.paramsSchema.properties && def.paramsSchema.properties.annotations;
    const tg = an && an.items && an.items.properties && an.items.properties.target;
    for (const v of (tg && tg.enum) || []) if (oneSide(v)) data.push(`schema offers the one-side target "${v}"`);
    expect(data, data.join('\n')).toEqual([]);
    const {bad} = await forAll(page, ID, `
      const out = [];
      x.seek(x.durationMs);
      const A = node(svg, 'rm-card-a-body'), B = node(svg, 'rm-card-b-body');
      if (!A || !B) return out;
      const ba = box(A), bb = box(B);
      const hit = (q, c) => q.l < c.r && c.l < q.r && q.t < c.b && c.t < q.b;
      const rings = [...svg.querySelectorAll('[data-node="rings"] [data-target], [data-node="rings"] rect, [data-node="rings"] circle')].filter(e => eff(svg, e) > 0.05);
      const by = {};
      for (const e of rings) { const t = e.getAttribute('data-target') || '?'; const q = box(e); by[t] = by[t] || {a: 0, b: 0}; if (hit(q, ba) && !hit(q, bb)) by[t].a++; if (hit(q, bb) && !hit(q, ba)) by[t].b++; }
      for (const [t, n] of Object.entries(by)) if (n.a !== n.b) out.push(pr.name + ' ' + ratio + ': note "' + t + '" rings A ' + n.a + '× and B ' + n.b + '×');
      return out;`, {}, {withHidden: false});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Item 12 (review-01 fix): the magnifier laid back at the hold rests in free space — its whole drawn box (ring, handle
 * and shadow) clear of every apartado sheet, every located frame and every line marker, by >= `gap` px at 1080p, in every
 * preset × ratio, labels shown and hidden.
 * @param {string} ID
 * @param {{rooms?:string[], gap?:number}} [o] rooms: node prefixes of the rooms (rm; ra and rb for a pair)
 */
export function lupaParkedClearTest(ID, {rooms = ['rm'], gap = 1} = {}) {
  test(`${ID}: the magnifier laid back at the hold lies clear of every sheet, located frame and marker (every preset × ratio × labels)`, async ({page}) => {
    test.setTimeout(400000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      svg.style.width = w + 'px'; svg.style.height = h + 'px';
      x.seek(x.durationMs);
      // (client px → px at 1080p: the frame's short side is 1080)
      const S = svg.getBoundingClientRect(), k = 1080 / Math.min(S.width, S.height);
      for (const p of arg.rooms) {
        const L = node(svg, p + '-lupa');
        if (!L || eff(svg, L) < 0.3) continue;
        const a = box(L);
        const others = [...svg.querySelectorAll('[data-node]')].filter(e => new RegExp('^' + p + '-(loc[0-9]+|exhibit[0-9]+|link-[ab][0-9]+-m)$').test(e.dataset.node) && eff(svg, e) >= 0.3);
        let least = 1e9;
        for (const o of others) {
          const c = box(o);
          const dx = Math.max(c.l - a.r, a.l - c.r), dy = Math.max(c.t - a.b, a.t - c.b);
          const d = Math.max(dx, dy) * k;
          least = Math.min(least, d);
          if (d < arg.gap) out.push(pr.name + ' ' + ratio + ': ' + p + '-lupa within ' + d.toFixed(1) + ' px of ' + o.dataset.node);
        }
        stat('least clearance px ' + ratio, Math.round(least * 10) / 10);
      }
      return out;`, {rooms, gap}, {withHidden: true});
    report(ID, 'parked magnifier', stats);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}
