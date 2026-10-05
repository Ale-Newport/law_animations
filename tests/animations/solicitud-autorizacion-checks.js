// Rendered and data checks for the four "Solicitud de autorización" entries (LAW-0329..0332, review-03), copied from
// ./ruta-recurso-checks.js (review-02; that file stays unchanged) and adapted. Legal risk is VERY HIGH (leave or permission
// to appeal): the stations are abstract and fictional, drawn at the SAME size on ONE row; the path is only the supplied
// sequence; the prior-examination tray is a neutral tray; "authorization requested" and "decision supplied" are two
// supplied states of equal weight, and the decision is a placeholder whose content is never shown. These checks forbid,
// in EN and ES, any leave rule or outcome (granted / concedida, refused / denied / denegada / inadmitida, admitted /
// admitida, leave to appeal, permiso para recurrir, criterio / criterion, threshold / umbral, admissibility), any rank or
// hierarchy (superior / inferior, higher / lower, tribunal, Supremo, instancia), time limits (plazo / deadline), duties
// (must / debe), validity (valid / válido) and outcomes (outcome / resultado) — in the supplied data and in the render;
// no jurisdiction named; every stress text longer than its baseline and every stress list at least as long; the glyph
// follows the state (● only for "authorization requested", ◆ only for "decision supplied", equal ink); every station has
// the same rendered size and the same baseline at every u; path lines start and end on their stations' lower edges; no
// text drawn twice.
import {test, expect} from '@playwright/test';
import {forAll, report} from './apertura-audiencia-checks.js';
import {presetsFor} from '../harness/contract.js';

/** English words that must not leak into a locale-'es' render (default texts). */
export const ES_WORDS = ['Station', 'Stations', 'Participant', 'Petition', 'petition', 'Decision', 'decision', 'Authorization', 'requested', 'document', 'fictional', 'supplied', 'Path', 'path', 'Steps', 'numbered', 'order', 'Prior-examination', 'examination', 'tray', 'Two-slot', 'Wall', 'calendar', 'configured', 'conclusion', 'Changed', 'was', 'content', 'shown', 'Each', 'Every', 'The', 'the', 'and', 'with', 'station', 'stop'];

/** People floors (coordinator; review = hearings: the rendered FIGURE): >= 60 px off 1:1; >= 55 px at 1:1; the stress
 * preset >= 45 px at every ratio (STRESS PEOPLE FLOOR OFF 1:1, 2026-10-05). */
export const FLOOR_FOR = "const st = preset.replace(' (labels hidden)', '') === 'long-labels-stress'; if (st) return 45; return ratio === '1:1' ? 55 : 60;";

/**
 * Banned wording (EN and ES): leave rules and outcomes, criteria and thresholds, rank and hierarchy, appeal rules, time
 * limits, duties, validity, institutions. The motif only shows a placeholder petition passing, along a path the user
 * configured, into a neutral prior-examination tray, and a supplied decision placeholder whose content is never shown.
 */
export const BANNED = /(\bgrant(s|ed|ing)?\b|conced|otorgad|\brefus|\bdenied|\bdeny|deneg|inadmit|\badmit|admitid|admisi|admissib|admisib|\bleave\b|permiso para|\bpermission to\b|criteri|threshold|umbral|superior|inferior|\bhigher\b|\blower\b|\bupper\b|\brank|\brango|jerarqu|hierarch|\blevel|\bnivel|instancia|\binstance\b|supreme|suprem[oa]|constitucional|constitutional|casaci|cassation|appeal|apelaci|apelar|recurs|recurr|\bgrounds?\b|\bmotivos?\b|\bplazo|deadline|time limit|l[ií]mite de tiempo|\bdue\b|\bmust\b|\bdebe|deber[aá]|required|obligatori|mandator|\bvalid|v[aá]lid[oa]|invalid|outcome|resultado|revocad|revoca\b|reversed|\brevers|\bconfirmad|\bconfirma\b|upheld|uphold|estimad|desestim|dismiss|rechaz|\breject|\bfallo\b|verdict|veredicto|judgment|judgement|\bruling|sentenci|\bwins?\b|ganador|\bgana\b|\bloses?\b|pierde|\bcourt\b|tribunal|\bjudge|\bjuez|magistrad|\blaw\b|\bley\b|binding|vinculante|firme\b|\bfinal\b|definitiv|error|err[oó]ne|\bwrong|incorrect|approv|aprobad|\bsuccess|[eé]xito|favorable|favourable)/i;

/** Jurisdiction names that must not appear in any supplied text (the motif stays `jurisdiction: unspecified`). */
export const JURIS = /(united states|\bu\.s\.|\busa\b|federal|england|wales|united kingdom|\buk\b|spain|españa|espanol|mexico|méxico|argentin|chile|colombia|per[uú]\b|california|new york|texas|supreme court|tribunal supremo|ley de enjuiciamiento|\blec\b|federal rules|civil procedure rules|código|codigo|\bcode of)/i;

const walkStrings = (v, path, fn) => {
  if (typeof v === 'string') { fn(v, path); return; }
  if (v && typeof v === 'object') for (const k of Object.keys(v)) walkStrings(v[k], `${path}.${k}`, fn);
};

/** Every supplied text (defaults and presets) is free of the banned wording (EN and ES). */
export function bannedDataTest(ID) {
  test(`${ID}: no supplied text (defaults and presets, EN and ES) carries a leave rule or outcome (granted / refused / admitted), a criterion, threshold, rank, time limit, duty or validity`, async () => {
    const def = (await import(`../../src/animations/review/${ID}.js`)).default;
    if (!presetsFor(ID).find(q => q.name === 'baseline-es')) throw new Error('no baseline-es preset');
    const all = [{name: 'default', params: def.defaultParams}, ...presetsFor(ID)];
    const bad = [];
    for (const pr of all) walkStrings(pr.params, '', (v, path) => { if (BANNED.test(v)) bad.push(`${pr.name} ${path}: "${v}"`); });
    expect(bad, bad.join('\n')).toEqual([]);
    // (the pattern catches the words the coordinator listed, in both languages)
    for (const w of ['leave granted', 'leave to appeal', 'Leave refused', 'permission was denied', 'autorización concedida', 'autorización denegada', 'petición inadmitida', 'solicitud admitida', 'the request is admitted', 'permiso para recurrir', 'criterio de admisión', 'the criterion', 'threshold', 'umbral', 'plazo de veinte días', 'deadline', 'el tribunal superior', 'órgano inferior', 'a higher court', 'Tribunal Supremo', 'the court must', 'el órgano debe', 'a valid request', 'petición válida', 'the outcome', 'el resultado', 'approved', 'aprobada', 'segunda instancia', 'recurso de apelación']) expect(BANNED.test(w), w).toBe(true);
    for (const w of ['Station A (fictional)', 'Puesto B (ficticio)', 'Authorization requested (as supplied)', 'Autorización solicitada (según lo aportado)', 'Decision supplied (as supplied)', 'Decisión suministrada (según lo aportado)', 'Decision: text supplied (content not shown)', 'Decisión: texto aportado (contenido no mostrado)', 'Path as configured (as supplied)', 'Recorrido configurado (según lo aportado)', 'Prior-examination tray: a neutral tray at the path’s last stop', 'Bandeja de examen previo: una bandeja neutra en la última parada', 'Steps numbered in the supplied order (illustrative)', 'Pasos numerados en el orden aportado (ilustrativo)', 'As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión', 'Petition (fictional; placeholder text)', 'Petición (ficticia; texto provisional)', 'Participante que lleva la petición (ficticio)']) expect(BANNED.test(w), w).toBe(false);
  });
}

/** The render (every preset, ratio, labels shown, several instants, plus an es-only render) never shows the banned wording. */
export function bannedRenderTest(ID) {
  test(`${ID}: no rendered text carries a leave rule or outcome, a criterion, threshold, rank, time limit, duty or validity (EN and ES)`, async ({page}) => {
    test.setTimeout(400000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      const re = new RegExp(arg.re, 'i');
      for (const u of [0, 0.3, 0.6, 0.8, 1]) {
        x.seek(u * x.durationMs);
        for (const t of texts(svg, 0.05)) {
          const s = (t.querySelectorAll('tspan').length ? [...t.querySelectorAll('tspan')].map(q => q.textContent).join(' ') : (t.textContent || '')).replace(/\\s+/g, ' ');
          if (re.test(s)) out.push(pr.name + ' ' + ratio + ': "' + s.slice(0, 50) + '"');
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

/** No jurisdiction: none named in any supplied text, never set, and the render says "jurisdiction unspecified" (EN, ES). */
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
    for (const w of ['Station A (fictional)', 'Puesto A (ficticio)', 'Recorrido configurado (según lo aportado)', 'Bandeja de examen previo: una bandeja neutra en la última parada']) expect(JURIS.test(w), w).toBe(false);
    const {bad: rb} = await forAll(page, ID, `
      x.seek(x.durationMs);
      const all = [...svg.querySelectorAll('[data-layer="content-notice"] text')].map(t => t.textContent).join(' | ');
      return /jurisdiction unspecified|jurisdicción no especificada/i.test(all) ? [] : [pr.name + ' ' + ratio + ': no "jurisdiction unspecified" in the render'];`, {}, {withHidden: false});
    bad.push(...rb);
    const {bad: re} = await forAll(page, ID, `
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const y = (await window.__lib.load(arg.id)).create(el, {width: w, height: h, params: {locale: 'es'}});
      await y.ready; y.seek(y.durationMs);
      const all = [...y.element.querySelectorAll('[data-layer="content-notice"] text')].map(t => t.textContent).join(' | ');
      y.destroy(); el.remove();
      return /jurisdicción no especificada/i.test(all) ? [] : ['es-only ' + ratio + ': no "jurisdicción no especificada"'];`, {id: ID}, {withHidden: false, presets: ['default']});
    bad.push(...re);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/** Stress strictly longer than baseline (AUTHORING item 20): every text longer, every list (nested too) at least as long. */
export function stressLongerTest(ID) {
  test(`${ID}: long-labels-stress — every text field is strictly longer than its baseline counterpart, every list (nested too) at least as long`, async () => {
    const def = (await import(`../../src/animations/review/${ID}.js`)).default;
    const base = def.defaultParams;
    const stress = presetsFor(ID).find(q => q.name === 'long-labels-stress').params;
    const ENUMS = new Set(['kind', 'side', 'focusTarget', 'focusElement', 'placement', 'id', 'from', 'to', 'locale', 'textVisibility', 'theme', 'palette', 'background', 'jurisdiction', 'aspectRatio', 'instanceId', 'target', 'finalState', 'traversalOrder', 'hair', 'beforeStatus', 'link', 'suppliedState']);
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

/** The es defaults carry "(aportado/a)" or "(según lo aportado)" wherever the en defaults carry "(as supplied)". */
export function esSuppliedTagTest(ID) {
  test(`${ID}: every es default text carries "(según lo aportado)" / "aportado/a" where the en default carries "(as supplied)"`, async () => {
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

/** Preset consistency: 2–4 stations; a path of indices into them with at least two distinct stops and no repeated stop in a row. */
export function routeConsistencyTest(ID, {extra = null} = {}) {
  test(`${ID}: every preset supplies 2–4 stations and a valid configured path (known stations, no stop repeated in a row)`, async () => {
    const def = (await import(`../../src/animations/review/${ID}.js`)).default;
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = [];
    for (const pr of presets) {
      const q = {...def.defaultParams, ...pr.params};
      const n = q.routes.bodies.length;
      if (n < 2 || n > 4) bad.push(`${pr.name}: ${n} bodies`);
      const st = q.routes.steps;
      if (st.some(v => v < 0 || v >= n)) bad.push(`${pr.name}: unknown body in ${st.join(',')}`);
      if (st.some((v, i) => i && st[i - 1] === v)) bad.push(`${pr.name}: a stop repeated in a row in ${st.join(',')}`);
      if (new Set(st).size < 2) bad.push(`${pr.name}: fewer than two stops`);
      if (extra) { const e = extra(q, pr.name); if (e) bad.push(...[].concat(e)); }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * No hierarchy (coordinator, rendered): every body station of a room has the SAME rendered size and the SAME top and
 * bottom (baseline) y at every u (step 0.05), in every preset × ratio × labels; the stations stand side by side in the
 * supplied order, left to right, without overlapping. Rooms: node prefixes (rm; ra and rb for a pair; ctx copies too).
 */
export function equalBodiesTest(ID, {rooms = ['rm'], step = 0.05} = {}) {
  test(`${ID}: every station has an equal size and the same baseline y at every u — no vertical rank (rendered)`, async ({page}) => {
    test.setTimeout(900000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      const tag = pr.name + ' ' + ratio;
      let worst = 0, n = 0;
      for (let u = 0; u <= 1.0001; u += arg.step) {
        x.seek(u * x.durationMs);
        for (const P of arg.rooms) {
          const plates = nodes(svg, new RegExp('^' + P + '-st\\\\d+-plate$')).filter(e => eff(svg, e) > 0.05).sort((a, b) => +a.dataset.node.match(/st(\\d+)/)[1] - +b.dataset.node.match(/st(\\d+)/)[1]);
          if (plates.length < 2) continue;
          n++;
          const B = plates.map(box);
          for (const q of B.slice(1)) {
            const d = Math.max(Math.abs(q.w - B[0].w), Math.abs(q.h - B[0].h), Math.abs(q.t - B[0].t), Math.abs(q.b - B[0].b));
            worst = Math.max(worst, d);
            if (d > 0.5) out.push(tag + ' ' + P + ' u=' + u.toFixed(2) + ': stations differ by ' + d.toFixed(2) + ' px (size or baseline)');
          }
          for (let i = 1; i < B.length; i++) if (B[i].l < B[i - 1].r - 0.5) out.push(tag + ' ' + P + ' u=' + u.toFixed(2) + ': station ' + i + ' not to the right of station ' + (i - 1));
        }
      }
      stat('worst station difference px ' + ratio, Math.round(worst * 100) / 100, 'max');
      stat('rooms checked ' + ratio, n, 'max');
      return [...new Set(out)].slice(0, 20);`, {rooms, step}, {withHidden: true});
    report(ID, 'equal bodies', stats);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * The route lands (rendered, every preset × ratio × labels, step `step`): every visible route line (solid, dashed or
 * base) starts on the lower edge of its own "from" station and ends on the lower edge of its own "to" station (inside the
 * station's width, within 3 px of its lower edge); each step disc sits on its own line.
 */
export function routeAnchoredTest(ID, {rooms = ['rm'], step = 0.05} = {}) {
  test(`${ID}: every route line starts and ends on its own stations' lower edges; every step disc sits on its own line (step ${step})`, async ({page}) => {
    test.setTimeout(900000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      const tag = pr.name + ' ' + ratio;
      let n = 0;
      for (let u = 0; u <= 1.0001; u += arg.step) {
        x.seek(u * x.durationMs);
        for (const P of arg.rooms) {
          for (const ln of nodes(svg, new RegExp('^' + P + '-r[tdb]\\\\d+$'))) {
            if (eff(svg, ln) < 0.05) continue;
            const nm = ln.dataset.node;
            const j = +nm.match(/(\\d+)$/)[1];
            const real = node(svg, P + '-rt' + j);
            const from = real.getAttribute('data-from'), to = real.getAttribute('data-to');
            const A0 = node(svg, P + '-st' + from + '-plate'), B0 = node(svg, P + '-st' + to + '-plate');
            if (!A0 || !B0) { out.push(tag + ': ' + nm + ' without its stations'); continue; }
            const m = ln.getScreenCTM();
            const p0 = ln.getPointAtLength(0), pL = ln.getPointAtLength(ln.getTotalLength());
            const A = new DOMPoint(p0.x, p0.y).matrixTransform(m), B = new DOMPoint(pL.x, pL.y).matrixTransform(m);
            const a = box(A0), b = box(B0);
            n++;
            const k1 = arg.px;
            if (A.x < a.l + 1 || A.x > a.r - 1 || Math.abs(A.y - a.b) > 3 + 8 * m.a) out.push(tag + ' u=' + u.toFixed(2) + ': ' + nm + ' does not start on station ' + from);
            if (B.x < b.l + 1 || B.x > b.r - 1 || Math.abs(B.y - b.b) > 3 + 8 * m.a) out.push(tag + ' u=' + u.toFixed(2) + ': ' + nm + ' does not end on station ' + to);
            void k1;
            const disc = node(svg, P + '-step' + j + '-disc');
            if (disc && eff(svg, disc) > 0.05) {
              const db = box(disc); const c = {x: (db.l + db.r) / 2, y: (db.t + db.b) / 2};
              let best = 1e9; const L = ln.getTotalLength();
              for (let s = 0; s <= L; s += L / 200) { const q = new DOMPoint(ln.getPointAtLength(s).x, ln.getPointAtLength(s).y).matrixTransform(m); best = Math.min(best, Math.hypot(q.x - c.x, q.y - c.y)); }
              if (best > 2.5) out.push(tag + ' u=' + u.toFixed(2) + ': step disc ' + j + ' is ' + best.toFixed(1) + ' px off its line');
            }
          }
        }
      }
      stat('route lines checked ' + ratio, n, 'max');
      return [...new Set(out)].slice(0, 20);`, {rooms, step}, {withHidden: true});
    report(ID, 'route anchored', stats);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Route lines never run under a visible text other than their own step number (rendered, every preset × ratio × labels,
 * step 0.05): station names, panel text, notes and the other steps' numbers stay clear of every line.
 */
export function routeOffTextTest(ID, {rooms = ['rm'], step = 0.05} = {}) {
  test(`${ID}: no route line runs under a text other than its own step number (step ${step})`, async ({page}) => {
    test.setTimeout(900000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      let checked = 0;
      for (let u = 0; u <= 1.0001; u += arg.step) {
        x.seek(u * x.durationMs);
        const T = texts(svg, 0.3).map(t => ({t, b: box(t)}));
        for (const P of arg.rooms) for (const ln of nodes(svg, new RegExp('^' + P + '-r[tdb]\\\\d+$'))) {
          if (eff(svg, ln) < 0.3) continue;
          const j = ln.dataset.node.match(/(\\d+)$/)[1];
          const own = node(svg, P + '-step' + j);
          const m = ln.getScreenCTM(); const L = ln.getTotalLength();
          const sw = (parseFloat(ln.getAttribute('stroke-width')) || 2) * Math.hypot(m.a, m.b) / 2;
          for (let s = 0; s <= L; s += 3) {
            const p0 = ln.getPointAtLength(s); const p = new DOMPoint(p0.x, p0.y).matrixTransform(m);
            checked++;
            for (const q of T) if (!(own && own.contains(q.t)) && p.x > q.b.l - sw && p.x < q.b.r + sw && p.y > q.b.t - sw && p.y < q.b.b + sw) { out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': ' + ln.dataset.node + ' under "' + q.t.textContent.slice(0, 24) + '"'); break; }
          }
        }
      }
      stat('line samples ' + ratio, checked, 'max');
      return [...new Set(out)].slice(0, 20);`, {rooms, step}, {withHidden: true});
    report(ID, 'route off text', stats);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * The glyph follows the state, everywhere it is drawn (u 0–1, step 0.05; every preset × ratio × labels, es-only too): ●
 * only on the "available" variants (sign-a, pin-a, lens/record a), ◆ only on the "not checked" ones; the legend rows lg-a
 * and lg-b carry ● and ◆; the two variants of the same role have the same ink area (±12 %).
 */
export function glyphStateTest(ID, {prefixes = ['rm']} = {}) {
  test(`${ID}: ● marks only "authorization requested" and ◆ only "decision supplied", everywhere, with equal ink (every preset × ratio × labels, es-only too)`, async ({page}) => {
    test.setTimeout(600000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      const tag = pr.name + ' ' + ratio;
      const kind = e => (e.tagName === 'circle' ? 'dot' : 'diamond');
      const ink = e => { const q = box(e); return e.tagName === 'circle' ? Math.PI * q.w * q.h / 4 : q.w * q.h / 2; };
      const runs = [[x, tag]];
      let y = null, el = null;
      if (pr.name === 'default') {
        el = document.createElement('div'); document.getElementById('slots').appendChild(el);
        y = (await window.__lib.load(arg.id)).create(el, {width: w, height: h, params: {locale: 'es'}});
        await y.ready;
        runs.push([y, 'es-only ' + ratio]);
      }
      for (const [inst, tg] of runs) {
        const sv = inst.element;
        for (let u = 0; u <= 1.0001; u += 0.05) {
          inst.seek(u * inst.durationMs);
          for (const P of arg.prefixes) {
            const gl = nodes(sv, new RegExp('^' + P + '-(sign-[ab]-d-g|rec-[ab]-d-g|dock-[ab]-d-g|(?:doc2?|dec)-pin-[ab]-g)$'));
            for (const e of gl) {
              const side = e.dataset.node.match(/-([ab])-(?:d-)?g$/)[1];
              const want = side === 'a' ? 'dot' : 'diamond';
              if (kind(e) !== want) out.push(tg + ' u=' + u.toFixed(2) + ': ' + e.dataset.node + ' is ' + kind(e));
            }
            for (const role of ['sign', 'doc-pin', 'doc2-pin', 'dec-pin', 'rec', 'dock']) {
              const dd = role === 'sign' || role === 'rec' || role === 'dock' ? '-d' : '';
              const A = gl.find(e => e.dataset.node === P + '-' + role + '-a' + dd + '-g');
              const B = gl.find(e => e.dataset.node === P + '-' + role + '-b' + dd + '-g');
              if (!A || !B) continue;
              const ia = ink(A), ib = ink(B);
              if (ia > 0.5 && ib > 0.5 && Math.max(ia, ib) / Math.min(ia, ib) > 1.12) out.push(tg + ' u=' + u.toFixed(2) + ': ' + role + ' ink ' + ia.toFixed(0) + ' vs ' + ib.toFixed(0));
            }
          }
          const ra = node(sv, 'lg-a'), rb = node(sv, 'lg-b');
          const has = (row, k) => [...row.querySelectorAll('circle, path')].some(e => (k === 'dot' ? e.tagName === 'circle' && !e.getAttribute('stroke') : e.tagName === 'path' && /^M[^H]*L[^H]*L[^H]*L[^H]*Z$/.test(e.getAttribute('d') || '')));
          if (ra && (!has(ra, 'dot') || has(ra, 'diamond'))) out.push(tg + ': the legend row of "authorization requested" is not ●');
          if (rb && (!has(rb, 'diamond') || has(rb, 'dot'))) out.push(tg + ': the legend row of "decision supplied" is not ◆');
        }
      }
      if (y) { y.destroy(); el.remove(); }
      return [...new Set(out)].slice(0, 30);`, {prefixes, id: ID}, {withHidden: true});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/** No text is drawn in two places at once (step 0.01). */
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

/** A number never splits from its unit (rendered; every preset, es-only too, labels shown, u step 0.1). */
export function gluedNumbersTest(ID, {step = 0.1} = {}) {
  test(`${ID}: no number is torn from its unit or its word, in any preset × ratio (es-only too)`, async ({page}) => {
    test.setTimeout(900000);
    const SRC = `
      const out = [];
      const UNIT = '(mm|cm|m|km|m²|km²|ha|mg|g|kg|t|ml|l|s|min|h|d|%|‰|°C|°|€|\\\\$|£)';
      const torn = (a, b) => /\\d$/.test(a) && new RegExp('^' + UNIT + '(?=[\\\\s,.;:)]|$)').test(b);
      const check = (y, tag) => {
        for (let u = 0; u <= 1.0001; u += arg.step) {
          y.seek(u * y.durationMs);
          for (const t of texts(y.element, 0.15)) {
            const L = [...t.querySelectorAll('tspan')].map(q => (q.textContent || '').replace(/\\s+/g, ' ').trim()).filter(Boolean);
            if (L.length < 2) continue;
            for (let i = 0; i < L.length - 1; i++) if (torn(L[i], L[i + 1])) out.push(tag + ' u=' + u.toFixed(1) + ': "' + L[i] + ' / ' + L[i + 1] + '"');
            for (let i = 1; i < L.length; i++) if (/^\\d+[.)]?$/.test(L[i]) || /^[A-ZÁÉÍÓÚÑ]$/.test(L[i])) out.push(tag + ' u=' + u.toFixed(1) + ': a number or letter alone on a line in "' + L.join(' / ') + '"');
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
    const {saGlue} = await import('../../src/animations/review/kits/solicitud-autorizacion.js');
    for (const [s, keep] of [['the fence stood 2 m inside the plot', '2 m'], ['Paso 2 (según lo aportado)', 'Paso 2'], ['Station A (fictional)', 'Station A'], ['Puesto C (ficticio)', 'Puesto C']]) expect(saGlue(s).includes(keep), `${s} keeps "${keep}"`).toBe(true);
  });
}

/** No visible multi-line text holds a one-word line (rendered: every preset × ratio, labels shown). */
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
 * Equal weight of the annotations: no note may single out one body or one state. In the data no annotation targets a
 * single body or side and the schema offers no such target; in the render (every preset × ratio, at the hold) a note's
 * rings ring every station alike (one each) or every step disc alike (one each), never some of them.
 */
export function noOneSideHighlightTest(ID) {
  test(`${ID}: no annotation, ring or highlight targets one body or one state alone (data, schema and render)`, async ({page}) => {
    test.setTimeout(400000);
    const def = (await import(`../../src/animations/review/${ID}.js`)).default;
    const oneSide = t => /(^|-)(a|b|\d)$/.test(String(t)) || /body-|station-\d|state-[ab]/.test(String(t));
    const data = [];
    for (const pr of [{name: 'default', params: def.defaultParams}, ...presetsFor(ID)]) for (const a of pr.params.annotations || []) if (oneSide(a.target)) data.push(`${pr.name}: note on "${a.target}"`);
    const an = def.paramsSchema && def.paramsSchema.properties && def.paramsSchema.properties.annotations;
    const tg = an && an.items && an.items.properties && an.items.properties.target;
    for (const v of (tg && tg.enum) || []) if (oneSide(v)) data.push(`schema offers the one-body target "${v}"`);
    expect(data, data.join('\n')).toEqual([]);
    const {bad} = await forAll(page, ID, `
      const out = [];
      x.seek(x.durationMs);
      const rings = [...svg.querySelectorAll('[data-node="rings"] [data-target]')].filter(e => eff(svg, e) > 0.05);
      const by = {};
      for (const e of rings) { const t = e.getAttribute('data-target') + '|' + e.getAttribute('stroke'); by[t] = (by[t] || 0) + 1; }
      const nSt = nodes(svg, /^rm-st\\d+-plate$/).length, nDisc = nodes(svg, /^rm-step\\d+-disc$/).length;
      for (const [t, n] of Object.entries(by)) {
        const target = t.split('|')[0];
        if (target === 'stations' && n !== nSt) out.push(pr.name + ' ' + ratio + ': stations ringed ' + n + ' of ' + nSt);
        if (target === 'route' && n !== nDisc) out.push(pr.name + ' ' + ratio + ': step discs ringed ' + n + ' of ' + nDisc);
      }
      return out;`, {}, {withHidden: false});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * AUTHORING item 16 (review-03 round 2: discs on crossings, tight parallel pairs): every step disc sits on its own step,
 * its rim >= lineGap px (1080p) from every OTHER step's line (stroke edge) and >= discGap px from every other disc; no two
 * step lines run as a tight pair (within pairGap px of each other) for longer than pairRun px — a crossing is short, a
 * parallel pair is long. Geometry is measured on the rendered paths (every preset × ratio, labels shown and hidden), at
 * instants where the room is drawn at full size.
 */
export function stepDiscClearTest(ID, {rooms = ['rm'], lineGap = 12, discGap = 12, pairGap = 12, pairRun = 60, at = [0.5, 1]} = {}) {
  test(`${ID}: step discs clear of other steps' lines (>= ${lineGap} px) and of each other (>= ${discGap} px); no tight parallel pair of step lines`, async ({page}) => {
    test.setTimeout(600000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      svg.style.width = w + 'px'; svg.style.height = h + 'px';
      const S = svg.getBoundingClientRect(), K = 1080 / Math.min(S.width, S.height);
      for (const uu of [].concat(arg.at)) for (const P of arg.rooms) {
        x.seek(uu * x.durationMs);
        const lines = {};
        for (const ln of nodes(svg, new RegExp('^' + P + '-rt\\\\d+$'))) {
          const j = +ln.dataset.node.match(/(\\d+)$/)[1];
          const m = ln.getScreenCTM(); const L = ln.getTotalLength();
          const pts = [];
          for (let i = 0; i <= 600; i++) { const q = ln.getPointAtLength(L * i / 600); const p = new DOMPoint(q.x, q.y).matrixTransform(m); pts.push({x: p.x * K, y: p.y * K}); }
          lines[j] = {pts, hw: (parseFloat(ln.getAttribute('stroke-width')) || 6) * Math.hypot(m.a, m.b) * K / 2, step: L * Math.hypot(m.a, m.b) * K / 600};
        }
        const discs = {};
        for (const c of nodes(svg, new RegExp('^' + P + '-step\\\\d+-disc$'))) {
          const j = +c.dataset.node.match(/step(\\d+)-disc$/)[1];
          const m = c.getScreenCTM(); const p = new DOMPoint(+c.getAttribute('cx'), +c.getAttribute('cy')).matrixTransform(m);
          discs[j] = {x: p.x * K, y: p.y * K, r: (+c.getAttribute('r') + 1.5) * Math.hypot(m.a, m.b) * K};
        }
        const tag = pr.name + ' ' + ratio + ' ' + P + ' u=' + uu;
        let minL = 1e9, minD = 1e9, maxRun = 0;
        for (const [j, d] of Object.entries(discs)) {
          // (on its own line)
          const own = lines[j];
          if (own) { const o = Math.min(...own.pts.map(q => Math.hypot(q.x - d.x, q.y - d.y))); if (o > 2) out.push(tag + ': disc ' + (+j + 1) + ' is ' + o.toFixed(1) + ' px off its own step'); }
          for (const [i, ln] of Object.entries(lines)) {
            if (i === j) continue;
            const g0 = Math.min(...ln.pts.map(q => Math.hypot(q.x - d.x, q.y - d.y))) - d.r - ln.hw;
            minL = Math.min(minL, g0);
            if (g0 < arg.lineGap) out.push(tag + ': disc ' + (+j + 1) + ' is ' + g0.toFixed(1) + ' px from step ' + (+i + 1) + "'s line");
          }
          for (const [i, e] of Object.entries(discs)) {
            if (+i <= +j) continue;
            const g1 = Math.hypot(e.x - d.x, e.y - d.y) - d.r - e.r;
            minD = Math.min(minD, g1);
            if (g1 < arg.discGap) out.push(tag + ': discs ' + (+j + 1) + ' and ' + (+i + 1) + ' are ' + g1.toFixed(1) + ' px apart');
          }
        }
        const ids = Object.keys(lines);
        for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
          const A = lines[ids[a]], B = lines[ids[b]];
          let run = 0;
          for (const q of A.pts) {
            const dd = Math.min(...B.pts.map(p => Math.hypot(p.x - q.x, p.y - q.y))) - A.hw - B.hw;
            // (a crossing — the lines touching — is no pair: only a stretch close but apart counts)
            if (dd >= 0 && dd < arg.pairGap) { run += A.step; maxRun = Math.max(maxRun, run); } else run = 0;
          }
        }
        if (maxRun > arg.pairRun) out.push(tag + ': two step lines run within ' + arg.pairGap + ' px of each other for ' + maxRun.toFixed(0) + ' px');
        stat('min disc-to-line px ' + ratio, Math.round(minL * 10) / 10);
        stat('min disc-to-disc px ' + ratio, Math.round(minD * 10) / 10);
        stat('max tight-pair run px ' + ratio, Math.round(maxRun), 'max');
      }
      return [...new Set(out)].slice(0, 30);`, {rooms, lineGap, discGap, pairGap, pairRun, at}, {withHidden: true});
    report(ID, 'step discs clear', stats);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}
