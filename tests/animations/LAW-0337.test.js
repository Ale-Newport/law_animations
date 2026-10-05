// LAW-0337 — Revisión de documentos · story. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): continuity of the motion (every piece, the participant and its hand move continuously), the
// anchoring of objects (a piece only moves while both hands are on its lower edge; folder A's cover only moves while the
// left hand holds its edge; pieces rest in the intake tray or in folder B) and the transformation recognisable with
// labels hidden (folder A is closed over the original file, every piece leaves the tray and ends in folder B, on folder
// B's side of the divider).
// Timing (u): rest 0–0.15 · the participant walks to folder A, takes the cover's edge and swings it closed (~0.17–0.26)
// · each piece: hands on it, lifted, carried, laid in folder B, hands let go (to ~0.70) · (● kept-separate: folder B is
// closed too) · back under the divider by 0.735 · sign 0.74–0.78 · notes 0.75–0.80 · state tag 0.76–0.81; still after.
// Legal: a neutral filing arrangement — both folders the same size and stroke (lane colours blue / amber, never red or
// green), a divider that decides nothing, placeholder sheets, the noted reason shown as supplied; no admissibility rule,
// assessment, time limit, outcome or jurisdiction. People floors (review = hearings, rendered FIGURE): >= 60 px off 1:1,
// >= 55 px at 1:1, long-labels-stress >= 45 px.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {jurisdictionTest, stressLongerTest} from './solicitud-autorizacion-checks.js';
import {LOCALES} from '../../src/animations/review/LAW-0337.js';

const ID = 'LAW-0337';
const FLOOR_FOR = "const st = preset.replace(' (labels hidden)', '') === 'long-labels-stress'; if (st) return 45; return ratio === '1:1' ? 55 : 60;";
// Banned wording for this motif (EN and ES): admissibility rules and outcomes, assessments of the pieces, validity,
// time limits, duties, institutions, ranks.
const BANNED = /(admisi|admissib|admisib|\badmit|admitid|inadmit|\bexclu|excluid|rechaz|\breject|\brefus|deneg|\bdenied|\ballow(ed)?\b|permitid|\bvalid|v[aá]lid|invalid|nulid|\bvoid\b|relevan|pertinen|probator|evidential|\bproof\b|\bprueba|\bplazo|deadline|time limit|\bdue\b|\blate\b|tard[ií]|extempor|\bmust\b|\bdebe|deber[aá]|required|obligatori|mandator|outcome|resultado|verdict|veredicto|\bfallo\b|judg(e)?ment|\bruling|sentenci|\bcourt\b|tribunal|\bjudge|\bjuez|magistrad|\blaw\b|\bley\b|\brank|jerarqu|superior|inferior|\bwins?\b|ganador|\bloses?\b|approv|aprobad|correct|incorrect|\bwrong|error)/i;
const ES_WORDS = ['Original', 'file', 'Separate', 'folder', 'Folder', 'Decision', 'review', 'Review', 'New', 'pieces', 'Divider', 'divider', 'neutral', 'decides', 'nothing', 'Reason', 'noted', 'proposer', 'Participant', 'filing', 'Intake', 'tray', 'Kept', 'closed', 'open', 'Wall', 'calendar', 'date', 'fictional', 'supplied', 'conclusion', 'drawn', 'content', 'shown', 'The', 'the', 'and', 'stay', 'side'];

/** Resolve what the render shows for a preset (a locale-'es' render localises untouched English defaults). */
const FIELDS_PRELUDE = `const EN = ${JSON.stringify(LOCALES.en)}, ES = ${JSON.stringify(LOCALES.es)}; if (p.locale === 'es') { const q = {...p}; for (const k of Object.keys(ES)) { if (JSON.stringify(p[k]) === JSON.stringify(EN[k])) q[k] = ES[k]; else if (p[k] && typeof p[k] === 'object' && !Array.isArray(p[k])) { const o = {...p[k]}; for (const kk of Object.keys(ES[k] || {})) if (JSON.stringify(p[k][kk]) === JSON.stringify((EN[k] || {})[kk])) o[kk] = ES[k][kk]; q[k] = o; } } p = q; }`;

contractSuite(ID, {
  continuity: ['p0', 'p1', 'p2', 'p3', 'person', 'hand', 'handL'],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.inTray === s.n && s.inB === 0 && s.coverA === -1 && s.coverB === -1 && s.reaching === 0 && s.pin === 0", label: 'rest: every piece in the tray, both folders open, hands down, no state shown'},
    {at: 0.145, fn: "s.inTray === s.n && s.reaching === 0 && s.coverA === -1", label: 'nothing happens during the rest beat'},
    {at: 0.3, fn: "s.coverA === 1 && s.inB === 0", label: 'folder A is closed over the original file before any piece is filed'},
    {at: 0.7, fn: "s.inB === s.n && s.inTray === 0 && s.coverA === 1", label: 'every piece lies in folder B; folder A stays closed'},
    {at: 1, fn: "s.phase === 'done' && s.inB === s.n && s.coverA === 1 && s.coverB === 1 && s.reaching === 0 && s.pin === 1 && s.allReached && s.problems.length === 0", label: 'hold (● kept-separate): both folders closed; hands down; the sign shows the state; the composition fits'},
    {at: 1, params: {finalState: 'open-for-review'}, fn: "s.inB === s.n && s.coverA === 1 && s.coverB === -1 && s.pin === 1", label: '◆ open-for-review: folder B stays open with its pieces'},
    {at: 0.4, params: {textVisibility: 'none'}, fn: "s.coverA === 1 && s.inTray < s.n", label: 'labels hidden: the same action'},
    {at: 1, params: {actionProgress: 0.4}, fn: 's.actionCapped && s.inB < s.n', label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {pieces: ['P1 (fictional)']}, fn: 's.n === 1 && s.inB === 1', label: 'one supplied piece: it alone is filed'},
    {at: 0.1, fn: "s.phase === 'rest' && s.inTray === s.n", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: `${FIELDS_PRELUDE} return [...(p.stateCaption ? [p.stateCaption] : []), p.decisions.title, p.grounds, p.routes.original, p.routes.additional, p.routes.divider, ...p.pieces, p.courier.label, p.outcomes.a, p.outcomes.b, p.labels.heading, p.labels.pieces, p.labels.key, p.objectLabels.intake, p.objectLabels.calendar, ...p.annotations.map(a => a.text)];`,
  content: `${FIELDS_PRELUDE} return [p.decisions.title, p.routes.original, p.routes.additional, ...p.pieces, p.courier.label, p.outcomes.a, p.outcomes.b];`,
  captions: `${FIELDS_PRELUDE} return [p.objectLabels.intake, p.objectLabels.calendar];`,
});

ratioChecks(ID, 'cause before effect, the pieces only in the hands, nothing crosses the divider, composition fits', [
  {at: times(0, 1, 0.005), fn: 's.lift === 0 || (s.reaching > 0.99 && s.handMode === "sheet")', label: 'a piece only moves while both hands are on it'},
  {at: times(0, 1, 0.005), fn: 's.carried === -1 || s.reaching > 0.99', label: 'off the tray and the folder, a piece is always in the hands'},
  {at: times(0, 1, 0.005), fn: '(s.coverA === -1 || s.coverA === 1) || (s.reaching > 0.99 && s.handMode === "cover")', label: 'folder A\'s cover only moves in the hand'},
  {at: times(0, 1, 0.01), fn: '[s.p0, s.p1, s.p2, s.p3].slice(0, s.n).every(q => q.x > s.dividerX)', label: 'no piece ever passes to folder A\'s side of the divider'},
  {at: times(0.3, 1, 0.01), fn: 's.coverA === 1', label: 'folder A is never opened again once closed'},
  {at: times(0.15, 0.75, 0.01), fn: 's.allReached', label: 'the hands stay within the arms\' reach'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0', label: 'the composition fits'},
]);

textFloorTest(ID);
inFrameTest(ID, {clipped: ['[data-node="rm-held"]', '[data-node="rm-p0"]']});
noOverlapTest(ID, {markers: ['[data-node="rings"]', '[data-node="rm-p0-head"]', '[data-node="rm-held"]', '[data-node="rm-sign"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {re: '^rm-p0$', floorFor: FLOOR_FOR});
// (counters, folders and the divider are drawn UNDER the participant; only what lies above it is checked)
headsClearTest(ID, {covers: ['[data-node="rings"] rect', '[data-node="rm-sign"]', '[data-node="rm-held"]']});
equalWeightTest(ID, {at: [0.1, 1], marks: [['[data-node="lg-sa"] circle', '[data-node="lg-sb"] path:first-of-type'], ['[data-node="rm-sign-a-d-g"]', '[data-node="rm-sign-b-d-g"]']]});
neutralityTest(ID);
noArrowsTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
seekHistoryTest(ID, {at: [0.2, 0.3, 0.45, 0.6, 0.7, 0.8, 1]});
fillMostTest(ID);
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});

const walkStrings = (v, path, fn) => {
  if (typeof v === 'string') { fn(v, path); return; }
  if (v && typeof v === 'object') for (const k of Object.keys(v)) walkStrings(v[k], `${path}.${k}`, fn);
};
test(`${ID}: no supplied text (defaults and presets, EN and ES) carries an admissibility rule, an assessment, validity, a time limit, a duty or an outcome`, async () => {
  const def = (await import(`../../src/animations/review/${ID}.js`)).default;
  const all = [{name: 'default', params: def.defaultParams}, {name: 'es defaults', params: LOCALES.es}, ...presetsFor(ID)];
  const bad = [];
  for (const pr of all) walkStrings(pr.params, '', (v, path) => { if (BANNED.test(v)) bad.push(`${pr.name} ${path}: "${v}"`); });
  expect(bad, bad.join('\n')).toEqual([]);
  for (const w of ['the new material is admitted', 'admisible', 'pieza inadmitida', 'excluded evidence', 'rejected', 'a valid document', 'plazo de diez días', 'deadline', 'the court must', 'outcome']) expect(BANNED.test(w), w).toBe(true);
});
test(`${ID}: no rendered text carries an admissibility rule, an assessment, validity, a time limit, a duty or an outcome (EN and ES)`, async ({page}) => {
  test.setTimeout(300000);
  const {bad} = await forAll(page, ID, `
    const out = [];
    const re = new RegExp(arg.re, 'i');
    for (const u of [0.3, 1]) { x.seek(u * x.durationMs); for (const t of texts(svg, 0.05)) if (re.test(t.textContent)) out.push(pr.name + ' ' + ratio + ': "' + t.textContent.slice(0, 50) + '"'); }
    return out;`, {re: BANNED.source});
  expect(bad, bad.join('\n')).toEqual([]);
});

// The two folders have equal weight: the same rendered size and stroke at every sampled u (16:9 / 9:16 / 1:1).
test(`${ID}: folders A and B are drawn at the same size and stroke (every preset × ratio)`, async ({page}) => {
  test.setTimeout(300000);
  const {bad} = await forAll(page, ID, `
    const out = [];
    for (const u of [0, 0.5, 1]) {
      x.seek(u * x.durationMs);
      svg.style.width = w + 'px'; svg.style.height = h + 'px';
      const A = node(svg, 'rm-folderA').querySelectorAll('path')[2], B = node(svg, 'rm-folderB').querySelectorAll('path')[2];
      const a = A.getBoundingClientRect(), b = B.getBoundingClientRect();
      if (Math.abs(a.width - b.width) > 0.5 || Math.abs(a.height - b.height) > 0.5 || Math.abs(a.top - b.top) > 0.5) out.push(pr.name + ' ' + ratio + ' u=' + u + ': folder A ' + a.width.toFixed(1) + 'x' + a.height.toFixed(1) + ' vs B ' + b.width.toFixed(1) + 'x' + b.height.toFixed(1));
      if (A.getAttribute('stroke-width') !== B.getAttribute('stroke-width')) out.push(pr.name + ' ' + ratio + ': stroke differs');
    }
    return out;`, {}, {withHidden: true});
  expect(bad, bad.join('\n')).toEqual([]);
});

// Nothing teleports (rendered, 60 fps): every piece, the participant and its hand move < 40 px per frame; whenever a
// piece is lifted both hands are on its lower edge (within 3 px); folder A's cover edge stays in the left hand.
test(`${ID}: the pieces and the participant move continuously; the hands hold the piece / cover edge (60 fps)`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    let prev = null, worst = 0, off = 0;
    for (let ms = 0; ms <= x.durationMs + 1e-6; ms += 1000 / 60) {
      x.seek(ms);
      const s = x.getState({bounds: false}).semantic;
      const k = s.pxu;
      const now = [s.p0, s.p1, s.p2, s.p3, s.person, s.hand, s.handL];
      if (prev) now.forEach((q, i) => { if (q && prev[i]) worst = Math.max(worst, Math.hypot(q.x - prev[i].x, q.y - prev[i].y) * k); });
      prev = now;
      if (s.reaching > 0.999 && s.gripR) off = Math.max(off, Math.hypot(s.hand.x - s.gripR.x, s.hand.y - s.gripR.y) * k);
      if (s.reaching > 0.999 && s.gripL) off = Math.max(off, Math.hypot(s.handL.x - s.gripL.x, s.handL.y - s.gripL.y) * k);
    }
    stat('max move px/frame ' + ratio, Math.round(worst), 'max');
    stat('max hand-grip gap ' + ratio, Math.round(off * 10) / 10, 'max');
    if (worst > 40) out.push(tag + ': something jumps ' + Math.round(worst) + ' px in one frame');
    if (off > 3) out.push(tag + ': the hand leaves its grip by ' + off.toFixed(1) + ' px');
    return out;`, {}, {withHidden: true});
  report(ID, 'continuity', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// The action reads with the labels hidden: folder A's cover closes, every piece leaves the tray and ends in folder B
// (right of the divider), the sign shows the state; no text anywhere in the scene.
test(`${ID}: labels hidden — folder A closes and the pieces end in folder B across the divider; no text`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
    const x = def.create(el, {width: 1920, height: 1080, params: {textVisibility: 'none'}});
    await x.ready;
    const svg = x.element;
    const op = e => { if (!e) return 0; let o = 1; for (let n = e; n && n !== svg; n = n.parentNode) { const a = n.getAttribute && n.getAttribute('opacity'); if (a) o *= parseFloat(a); } return o; };
    x.seek(0); const h0 = x.getState({bounds: false}).semantic;
    x.seek(x.durationMs); const h2 = x.getState({bounds: false}).semantic;
    const slots = [...svg.querySelectorAll('[data-node^="rm-slotN"]')].map(op);
    return {moved: Math.hypot(h2.p0.x - h0.p0.x, h2.p0.y - h0.p0.y), cA: h2.coverA, inB: h2.inB, n: h2.n, slots, sign: op(svg.querySelector('[data-node="rm-sign-a"]')), text: [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length};
  }, ID);
  expect(out.moved).toBeGreaterThan(80);
  expect(out.cA).toBe(1);
  expect(out.inB).toBe(out.n);
  expect(Math.min(...out.slots)).toBeGreaterThan(0.95);
  expect(out.sign).toBeGreaterThan(0.95);
  expect(out.text).toBe(0);
});

// Item 9: the status sign is empty until the sign beat (0.74), then shows only the supplied state (both states, every
// preset × ratio × labels hidden).
test(`${ID}: the status sign shows no state before its beat; then only the supplied one`, async ({page}) => {
  test.setTimeout(600000);
  const bad = [];
  for (const finalState of ['kept-separate', 'open-for-review']) {
    const {bad: b} = await forAll(page, ID, `
      const out = [];
      const tag = pr.name + ' ' + ratio + ' ' + arg.finalState;
      const el2 = document.createElement('div'); document.getElementById('slots').appendChild(el2);
      const params = {...pr.params, finalState: arg.finalState, ...(pr.name.includes('labels hidden') ? {textVisibility: 'none'} : {})};
      delete params.stateCaption;
      const z = (await window.__lib.load(arg.id)).create(el2, {width: w, height: h, params}); await z.ready;
      const sv = z.element;
      const want = arg.finalState === 'kept-separate' ? 'a' : 'b', other = want === 'a' ? 'b' : 'a';
      for (let u = 0; u <= 1.0001; u += 0.01) {
        z.seek(u * z.durationMs);
        const sw = eff(sv, node(sv, 'rm-sign-' + want)), so = eff(sv, node(sv, 'rm-sign-' + other));
        if (so > 0.01) out.push(tag + ' u=' + u.toFixed(2) + ': the other state shows');
        if (u < 0.74 - 1e-9 && sw > 0.01) out.push(tag + ' u=' + u.toFixed(2) + ': the state shows before its beat');
      }
      z.seek(z.durationMs);
      if (eff(sv, node(sv, 'rm-sign-' + want)) < 0.95) out.push(tag + ': the supplied state is not on the sign at the hold');
      z.destroy(); el2.remove();
      return out;`, {finalState, id: ID}, {withHidden: true});
    bad.push(...b);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

// Item 18: the acting objects are large — at the hold folder B is >= 0.07 of the frame width at 16:9 and 1:1 and
// >= 0.12 at 9:16 (stress >= 0.06 / 0.1), and the room spans >= 0.5 of the frame width (>= 0.8 at 9:16).
test(`${ID}: the folders and the room are large — rendered share of the frame width at the hold`, async ({page}) => {
  test.setTimeout(400000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    svg.style.width = w + 'px'; svg.style.height = h + 'px';
    x.seek(x.durationMs);
    const F = svg.getBoundingClientRect();
    const fb = node(svg, 'rm-folderB').querySelectorAll('path')[2].getBoundingClientRect().width / F.width;
    const room = node(svg, 'rm-walls').getBoundingClientRect().width / F.width;
    stat('folder B share ' + ratio, Math.round(fb * 1000) / 1000);
    stat('room share ' + ratio, Math.round(room * 1000) / 1000);
    const st = /long-labels-stress/.test(pr.name), tall = ratio === '9:16';
    const fMin = tall ? (st ? 0.1 : 0.12) : (st ? 0.06 : 0.07);
    const rMin = tall ? 0.8 : 0.5;
    if (fb < fMin) out.push(pr.name + ' ' + ratio + ': folder B ' + fb.toFixed(3) + ' < ' + fMin);
    if (room < rMin) out.push(pr.name + ' ' + ratio + ': room ' + room.toFixed(3) + ' < ' + rMin);
    return out;`, {}, {withHidden: true});
  report(ID, 'acting objects share', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});
