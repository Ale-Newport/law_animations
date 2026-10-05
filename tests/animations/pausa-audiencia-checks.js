// Rendered and data checks for the four "Pausa de audiencia" entries (LAW-0309..0312, hearings-08).
// Earlier checks are imported read-only; this file adds the motif's own: no rule on recesses — no adjournment, permitted
// duration, time limit, consequence, contempt, sanction, ruling or end of the proceedings (EN and ES, in the supplied
// data and in the render) — no jurisdiction named anywhere (and the render says "jurisdiction unspecified"), every
// stress text longer than its baseline and every stress list at least as long (nested counts), preset consistency (one
// active place, one recess place, the operator a participant, the recess caption carrying the supplied stop time), the
// cue beside each supplied state is that state's own glyph, no text is drawn twice, the es defaults carry "(aportado/a)"
// wherever the en ones carry "(as supplied)", the participants keep their positions and the paused clock never jumps.
import {test, expect} from '@playwright/test';
import {forAll, report, HELPERS} from './apertura-audiencia-checks.js';
import {presetsFor} from '../harness/contract.js';

/** English words that must not leak into a locale-'es' render (default texts). */
export const ES_WORDS = ['Participant', 'Exhibit', 'Room', 'fictional', 'supplied', 'Sequence', 'Session', 'session', 'Recess', 'recess', 'clock', 'Clock', 'Positions', 'positions', 'kept', 'lectern', 'Lectern', 'cabinet', 'configured', 'conclusion', 'Changed', 'was', 'paused', 'active', 'Wall', 'from'];

/** People floors (coordinator; hearings measure the rendered FIGURE): >= 60 px off 1:1; >= 55 px at 1:1 for every
 * preset except long-labels-stress (>= 45 px). */
export const FLOOR_FOR = "if (ratio !== '1:1') return 60; return preset.replace(' (labels hidden)', '') === 'long-labels-stress' ? 45 : 55;";

/**
 * Banned wording (EN and ES): rules on recesses (adjournment, sine die, permitted or maximum durations, time limits,
 * deadlines), duties (must / debe, required, mandatory, permitted), consequences (contempt / desacato, sanction, penalty,
 * fine), rulings and outcomes, and any reading of the recess as a problem or an end (suspension, closing, termination,
 * resumption, delay, lateness, interruption). The motif only shows a supplied stop time, a recess and kept positions.
 */
export const BANNED = /(adjourn|aplaz|sine die|contempt|desacato|\bmaxim|m[aá]xim|\bminim|m[ií]nim|deadline|\bplazo|time limit|\blimit|l[ií]mite|duraci|duration|\bmust\b|\bdebe|deber[aá]|required|requisit|mandator|obligat|permit|allowed|autoriz|\bruling|\bruled\b|resoluci|\bfallo|sentencia|decisi|\bdecision|sanction|sanci[oó]n|penal|\bfine[sd]?\b|\bmulta|consequen|consecuen|suspend|suspensi|terminat|\bterminad|clos(e|ed|ing|ure)\b|cierre|cerrad|\bend(s|ed)?\b|finaliz|resum|reanud|\bdelay|retras|\blate\b|tard[ea]|interrupt|interrump|disrupt|problem|incidente|\bfault|culpa|dismiss|archiv|\brule[sd]?\b|\bregla|\bnorma\b|\blaw\b|\bley\b|judge|\bjuez|magistrad|\bcourt\b|tribunal|verdict|veredict|outcome|resultado|\bwins?\b|ganador|\bvalid|v[aá]lid[oa])/i;

/** Jurisdiction names that must not appear in any supplied text (the motif stays `jurisdiction: unspecified`). */
export const JURIS = /(united states|\bu\.s\.|\busa\b|federal|england|wales|united kingdom|\buk\b|spain|españa|espanol|mexico|méxico|argentin|chile|colombia|per[uú]\b|california|new york|texas|supreme court|tribunal supremo|ley de enjuiciamiento|\blec\b|federal rules|civil procedure rules|código|codigo|\bcode of)/i;

const walkStrings = (v, path, fn) => {
  if (typeof v === 'string') { fn(v, path); return; }
  if (v && typeof v === 'object') for (const k of Object.keys(v)) walkStrings(v[k], `${path}.${k}`, fn);
};

/** Every supplied text (defaults, es-only defaults and presets) is free of the banned wording (EN and ES). */
export function bannedDataTest(ID) {
  test(`${ID}: no supplied text (defaults and presets, EN and ES) names a rule on recesses, a duration or limit, a consequence or an end`, async () => {
    const def = (await import(`../../src/animations/hearings/${ID}.js`)).default;
    if (!presetsFor(ID).find(q => q.name === 'baseline-es')) throw new Error('no baseline-es preset');
    const all = [{name: 'default', params: def.defaultParams}, ...presetsFor(ID)];
    const bad = [];
    for (const pr of all) walkStrings(pr.params, '', (v, path) => { if (BANNED.test(v)) bad.push(`${pr.name} ${path}: "${v}"`); });
    expect(bad, bad.join('\n')).toEqual([]);
    // (the pattern catches the words the coordinator listed, in both languages; it lets the motif's own words through)
    for (const w of ['adjourned', 'aplazada', 'sine die', 'contempt of court', 'desacato', 'maximum recess', 'máximo', 'deadline', 'plazo', 'must return', 'debe volver', 'ruling', 'resolución', 'sanction', 'sanción', 'penalty', 'time limit', 'duration of 15 minutes', 'session closed', 'the hearing ends', 'resumes at 11:00', 'se reanuda', 'suspended', 'suspensión', 'interrupted', 'delay']) expect(BANNED.test(w), w).toBe(true);
    for (const w of ['Recess from 10:40 (as supplied)', 'Receso desde las 10:40 (aportado)', 'Session clock (as supplied)', 'Reloj de sesión (aportado)', 'Session active (as supplied)', 'Sesión activa (aportada)', 'Positions kept (as supplied)', 'Posiciones conservadas (aportadas)', 'As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión', 'The session clock stops at the supplied time; the wall clock runs on', 'Sequence as configured (illustrative)']) expect(BANNED.test(w), w).toBe(false);
  });
}

/** The render (every preset, ratio, labels shown, several instants, plus an es-only render) never shows the banned wording. */
export function bannedRenderTest(ID) {
  test(`${ID}: no rendered text names a rule on recesses, a duration or limit, a consequence or an end (EN and ES)`, async ({page}) => {
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
    for (const pr of all) {
      walkStrings(pr.params, '', (v, path) => { if (JURIS.test(v)) bad.push(`${pr.name} ${path}: "${v}"`); });
      if (pr.params.jurisdiction !== undefined && pr.params.jurisdiction !== 'unspecified') bad.push(`${pr.name}: jurisdiction ${pr.params.jurisdiction}`);
    }
    for (const w of ['Federal Rules of Civil Procedure', 'Ley de Enjuiciamiento Civil', 'England and Wales', 'Tribunal Supremo']) expect(JURIS.test(w), w).toBe(true);
    for (const w of ['Hearing room 4 (fictional)', 'Sala de audiencias 4 (ficticia)', 'Recess from 10:40 (as supplied)']) expect(JURIS.test(w), w).toBe(false);
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
    const def = (await import(`../../src/animations/hearings/${ID}.js`)).default;
    const base = def.defaultParams;
    const stress = presetsFor(ID).find(q => q.name === 'long-labels-stress').params;
    const ENUMS = new Set(['kind', 'op', 'beforeState', 'focusTarget', 'focusElement', 'placement', 'id', 'from', 'to', 'locale', 'textVisibility', 'theme', 'palette', 'background', 'jurisdiction', 'aspectRatio', 'instanceId', 'target', 'finalState', 'traversalOrder', 'hair']);
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
  test(`${ID}: every es default text carries "(aportado/a)" where the en default carries "(as supplied)"`, async () => {
    const def = (await import(`../../src/animations/hearings/${ID}.js`)).default;
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
 * Preset consistency: one active place and one recess place; the operator is a participant; the sequence is valid; the
 * recess caption carries the supplied stop time (H:MM) — the hands and the caption tell the same fictional time.
 */
export function pauseConsistencyTest(ID, {capField = null} = {}) {
  test(`${ID}: every preset supplies one active place, one recess place and a recess caption with the supplied stop time`, async () => {
    const def = (await import(`../../src/animations/hearings/${ID}.js`)).default;
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = [];
    for (const pr of presets) {
      const q = {...def.defaultParams, ...pr.params};
      const n = k => q.statements.filter(s => s.kind === k).length;
      if (n('active') !== 1 || n('recess') !== 1) bad.push(`${pr.name}: ${n('active')} active / ${n('recess')} recess`);
      if (q.operator >= q.speakers.length) bad.push(`${pr.name}: operator ${q.operator} is not a participant`);
      if (new Set(q.sequence).size !== q.sequence.length || q.sequence.some(v => v > 1)) bad.push(`${pr.name}: sequence ${q.sequence.join(',')}`);
      const t = `${q.clock.hour}:${String(q.clock.minute).padStart(2, '0')}`;
      const cap = capField ? capField(q) : q.statements.find(s => s.kind === 'recess').text;
      if (!cap.includes(t)) bad.push(`${pr.name}: recess caption "${cap}" does not carry the stop time ${t}`);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * The cue beside each supplied state is that state's own glyph, everywhere it is drawn: ● on the session clock's plate and
 * in the legend row of "session active"; ◆ on the recess caption and in the "recess" row; the two with the same ink area.
 */
export function glyphStateTest(ID, {prefixes = ['rm'], at = [1]} = {}) {
  test(`${ID}: ● is drawn beside "session active" (a running clock) and ◆ beside "recess" (a paused clock, the recess card), everywhere, with equal ink`, async ({page}) => {
    test.setTimeout(300000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      const tag = pr.name + ' ' + ratio;
      const kind = e => { if (!e) return null; const c = e.tagName === 'circle' ? e : e.querySelector && e.querySelector('circle'); const p = e.tagName === 'path' ? e : e.querySelector && e.querySelector('path'); return c ? 'dot' : p ? 'diamond' : null; };
      const ink = e => { const q = e.getBoundingClientRect(); return e.tagName === 'circle' ? Math.PI * q.width * q.height / 4 : q.width * q.height / 2; };
      for (const u of arg.at) {
        x.seek(u * x.durationMs);
        for (const P of arg.prefixes) {
          const a0 = node(svg, P + '-tagplate-g'), a2 = node(svg, P + '-tagplate-g2'), b = node(svg, P + '-capplate-g') || node(svg, P + '-cap-g');
          if (a0 && eff(svg, a0) > 0.5 && kind(a0) !== 'dot') out.push(tag + ' ' + P + ': the running clock plate does not carry ●');
          if (a2 && eff(svg, a2) > 0.5 && kind(a2) !== 'diamond') out.push(tag + ' ' + P + ': the paused clock plate does not carry ◆');
          const a = a0 && eff(svg, a0) > 0.5 ? a0 : a2;
          if (b && eff(svg, b) > 0.5 && kind(b) !== 'diamond') out.push(tag + ' ' + P + ': the recess caption does not carry ◆');
          if (a && b && eff(svg, a) > 0.5 && eff(svg, b) > 0.5) { const ia = ink(a), ib = ink(b); if (Math.max(ia, ib) / Math.max(1e-6, Math.min(ia, ib)) > 1.12) out.push(tag + ' ' + P + ': ink ' + ia.toFixed(0) + ' vs ' + ib.toFixed(0)); }
        }
        const rd = node(svg, 'lg-active'), rt = node(svg, 'lg-recess');
        if (rd && kind(rd.querySelector('g')) !== 'dot') out.push(tag + ': the legend row of "session active" is not ●');
        if (rt && kind(rt.querySelector('g')) !== 'diamond') out.push(tag + ': the legend row of "recess" is not ◆');
      }
      return out;`, {at, prefixes}, {withHidden: true});
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
 * The actors keep their positions (rendered, 60 fps over the whole timeline, every preset × ratio × labels): each
 * person's head centre stays within 1.5 px of where it stood at u = 0 (relative to its room's walls, so a stepping-back
 * context in the inspect entry is followed); the session clock's minute hand never jumps (<= 6° per frame) and, once
 * paused, stands still while the wall clock's hand keeps turning — the paused clock never reads as broken.
 */
export function positionsKeptTest(ID, {rooms = ['rm'], pausedFrom = null, wall = true, maxStep = 6} = {}) {
  test(`${ID}: the participants keep their positions; the session clock slows smoothly and, once paused, stands still while the wall clock runs (60 fps; ${rooms.join(', ')})`, async ({page}) => {
    test.setTimeout(900000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      const tag = pr.name + ' ' + ratio;
      const k = svg.getScreenCTM().a;
      const ang = e => { const m = /rotate\\(([-\\d.]+)/.exec(e.getAttribute('transform') || ''); return m ? parseFloat(m[1]) : 0; };
      for (const P of arg.rooms) {
        const walls = node(svg, P + '-walls');
        if (!walls) continue;
        const heads = nodes(svg, new RegExp('^' + P + '-p\\\\d-head$'));
        const rel = (e) => { const W0 = walls.getBoundingClientRect(); const c = headCircle(e); return {x: (c.x - W0.left) / W0.width, y: (c.y - W0.top) / W0.height, s: W0.width}; };
        x.seek(0);
        const h0 = heads.map(rel);
        const mn = node(svg, P + '-sclock-min'), wl = node(svg, P + '-clock-min');
        let prev = mn ? ang(mn) : 0, worstJump = 0, worstMove = 0, stillFrom = null, wallTurn = 0, wallAt = null;
        for (let ms = 0; ms <= x.durationMs + 1e-6; ms += 1000 / 60) {
          x.seek(ms);
          heads.forEach((e, i) => { const q = rel(e); const W1 = walls.getBoundingClientRect(); const d = Math.hypot((q.x - h0[i].x) * W1.width, (q.y - h0[i].y) * W1.height) / k; worstMove = Math.max(worstMove, d); });
          if (mn) { const a = ang(mn); worstJump = Math.max(worstJump, Math.abs(a - prev)); prev = a; }
          const u = ms / x.durationMs;
          if (arg.pausedFrom !== null && u >= arg.pausedFrom) {
            if (stillFrom === null) stillFrom = mn ? ang(mn) : 0;
            if (mn && Math.abs(ang(mn) - stillFrom) > 0.01) out.push(tag + ' ' + P + ' u=' + u.toFixed(3) + ': the paused session clock moved');
            if (wl) { const a = ang(wl); if (wallAt === null) wallAt = a; wallTurn = Math.abs(a - wallAt); }
          }
        }
        stat('worst head drift px ' + ratio, Math.round(worstMove * 100) / 100, 'max');
        stat('worst minute-hand step deg ' + ratio, Math.round(worstJump * 100) / 100, 'max');
        if (worstMove > 1.5) out.push(tag + ' ' + P + ': a participant moved ' + worstMove.toFixed(2) + ' px');
        if (worstJump > arg.maxStep) out.push(tag + ' ' + P + ': the session clock jumped ' + worstJump.toFixed(2) + '° in one frame');
        if (arg.pausedFrom !== null && arg.wall && wl && wallTurn < 1) out.push(tag + ' ' + P + ': the wall clock does not keep running while the session clock is paused');
      }
      return [...new Set(out)].slice(0, 20);`, {rooms, pausedFrom, wall, maxStep}, {withHidden: true});
    report(ID, 'positions and clocks', stats);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * The glyph follows the state (coordinator ruling, hearings-08 review): ● means "session active" and ◆ "recess". Once a
 * room's session clock is paused (its pause badge shows), no ● glyph is visible in that room (its clock plate carries
 * ◆ or no glyph); every visible ● in a room belongs to a running clock; a header ● (contrast, A) is over a room whose
 * clock runs. Checked at u 0.4–1 (step 0.02, the hold included), every preset × ratio × labels shown/hidden, es-only too.
 */
export function glyphFollowsStateTest(ID, {rooms = ['rm'], header = null} = {}) {
  test(`${ID}: the glyph follows the state — nothing paused carries ● (u 0.4–1, every preset × ratio × labels, es-only too)`, async ({page}) => {
    test.setTimeout(600000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, {name: 'es-only', params: {locale: 'es'}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets, rooms, header, helpers]) => {
      const H = new Function(`${helpers}; return {eff, node};`)();
      const def = await window.__lib.load(id);
      const out = [];
      const isDot = e => e && (e.tagName === 'circle' || (e.querySelector && e.querySelector('circle') && !e.querySelector('path')));
      for (const pr of presets) for (const tv of [null, 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: tv ? {...pr.params, textVisibility: tv} : pr.params});
        await x.ready;
        const svg = x.element;
        const tag = pr.name + (tv ? ' (labels hidden)' : '') + ' ' + ratio;
        for (let u = 0.4; u <= 1.0001; u += 0.02) {
          x.seek(u * x.durationMs);
          for (const P of rooms) {
            const badge = H.node(svg, P + '-pause');
            if (!badge) continue;
            const paused = H.eff(svg, badge) > 0.5;
            const dots = [...svg.querySelectorAll('[data-node^="' + P + '-"]')].filter(e => /-g\d?$/.test(e.getAttribute('data-node')) && isDot(e) && H.eff(svg, e) > 0.05);
            if (paused && dots.length) out.push(tag + ' u=' + u.toFixed(2) + ' ' + P + ': the paused clock\'s room shows ● (' + dots.map(e => e.getAttribute('data-node')).join(', ') + ')');
            if (header && header[P]) { const hc = H.node(svg, header[P]); if (hc && isDot(hc) && H.eff(svg, hc) > 0.05 && paused) out.push(tag + ' u=' + u.toFixed(2) + ': header ● over a paused room ' + P); }
          }
        }
        x.destroy(); el.remove();
      }
      return [...new Set(out)].slice(0, 30);
    }, [ID, presets, rooms, header, HELPERS]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}
