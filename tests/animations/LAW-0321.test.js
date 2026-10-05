// LAW-0321 — Identificación de motivo · story. Contract battery + ID-specific rendered checks.
// acceptanceCheck (brief): continuity of the motion, anchoring of objects (the party's hand is the solved hand on the
// magnifier's grip; the magnifier rests on the table, is carried along the table's edge with the lens over the apartados
// and is laid back; every line starts on its own card's lower edge and lands on its own apartado's upper edge, its marker
// riding the tip) and the transformation (the located apartados framed and linked) recognisable with labels hidden.
// Timing (u): rest 0–0.15 · hand to the grip 0.15–0.20 · lift 0.20–0.235 · scan 0.235–0.60 (the lens passes over every
// apartado and stops over each located one while its frame settles) · laid back 0.60–0.625 · hand lets go 0.625–0.665 ·
// lines 0.644–0.726 (all together) · notes 0.75–0.80 · state tag 0.76–0.81; still from 0.81.
// Legal (VERY HIGH risk): the decision carries only supplied placeholder text; the two labels are neutral labels supplied
// by the party with equal weight; no appeal rule, admissibility, time limit, standard of review, evaluation of any
// apartado, outcome or jurisdiction; "impugnar" / "challenge" only as the party's supplied intention. People floors
// (coordinator; hearings measure the FIGURE height): >= 60 px off 1:1; >= 55 px at 1:1 except long-labels-stress (>= 45).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, headsClearTest, chipsOwnTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {armsClearTest, linesOffTextTest, textLinesVisibleTest, subjectFrameTest} from './exposicion-inicial-checks.js';
import {bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, esSuppliedTagTest, imConsistencyTest, glyphSideTest, noTwinTextTest, placesKeptTest, linksAnchoredTest, gluedNumbersTest, noOneWordLineTest, noOneSideHighlightTest, lupaParkedClearTest, ES_WORDS, FLOOR_FOR} from './identificacion-motivo-checks.js';

const ID = 'LAW-0321';
const eq = 's.drawA.every((q, j) => j >= s.drawB.length || q === s.drawB[j])';

contractSuite(ID, {
  continuity: ['hand', 'lupa', 'party', 'tipA', 'tipB'],
  semantic: [
    {at: 0, fn: "s.beat === 'rest' && s.lupaPhase === 'rest' && s.locK.every(q => q === 0) && s.linkState === 'none' && s.reaching === 0", label: 'rest: the magnifier on the table; nothing located; no line'},
    {at: 0.145, fn: "s.lupaPhase === 'rest' && s.reaching === 0", label: 'nothing happens during the rest beat'},
    {at: 0.2, fn: "s.reaching > 0.99 && s.carry === 0", label: 'the hand reaches the grip before the magnifier moves (cause before effect)'},
    {at: 0.3, fn: "s.carry === 1 && s.reaching === 1 && s.lupaScale > 1.05", label: 'the magnifier is carried, lifted, in the hand'},
    {at: 0.62, fn: "s.locK.every(q => q === 1) && s.linkState === 'none'", label: 'every located apartado is framed before any line runs'},
    {at: 0.69, fn: `s.linkState === 'linking' && ${eq} && s.lupaPhase === 'laid'`, label: 'then the lines run, A and B at the same pace, the magnifier laid back'},
    {at: 1, fn: "s.linkState === 'linked' && s.lupaPhase === 'laid' && s.reaching === 0 && s.finalState === 'located-labelled' && s.allReached && s.problems.length === 0 && s.chipShift === 0", label: 'hold: located and linked; hand down; the party back at its place; the composition fits'},
    {at: 1, fn: 's.cardSize.a[0] === s.cardSize.b[0] && s.cardSize.a[1] === s.cardSize.b[1] && s.linksA.length === s.linksB.length', label: 'equal weight: both cards the same size; the same number of lines'},
    {at: 0.45, params: {textVisibility: 'none'}, fn: "s.carry === 1 && s.lupaPhase !== 'rest'", label: 'labels hidden: the same scan'},
    {at: 1, params: {finalState: 'located-only'}, fn: "s.linkState === 'none' && s.locK.every(q => q === 1)", label: 'supplied state: located without lines'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.linkState === 'none'", label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {sequence: [1, 0]}, fn: "s.order === '1>0' && s.boardLeft === 'b' && s.cardB.x < s.cardA.x", label: 'the supplied sequence decides the order of the labels on the board'},
    {at: 0.1, fn: "s.lupaPhase === 'rest' && s.locK.every(q => q === 0)", label: 'seeking back restores the rest state exactly'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [...(p.stateCaption ? [p.stateCaption] : []), p.decisions.title, ...p.speakers.map(s => s.label), ...p.grounds.map(s => s.text), ...p.decisions.sections, p.outcomes.a, p.outcomes.b, p.labels.sequence, p.labels.key, p.actorLabels.participant, p.objectLabels.board, p.objectLabels.table, p.objectLabels.calendar, p.objectLabels.located, ...p.annotations.map(a => a.text)];",
  content: 'return [p.decisions.title, ...p.speakers.map(s => s.label), ...p.grounds.map(s => s.text), ...p.decisions.sections];',
  captions: 'return [p.actorLabels.participant, p.objectLabels.board, p.objectLabels.table, p.objectLabels.calendar, p.objectLabels.located, p.labels.sequence];',
});

ratioChecks(ID, 'cause before effect, equal pace on both sides, composition fits', [
  {at: times(0, 1, 0.005), fn: `${eq}`, label: 'A and B are always at the same point'},
  {at: times(0, 0.7, 0.005), fn: "s.carry === 0 || s.reaching > 0.99", label: 'the magnifier only moves while the hand is on it'},
  {at: times(0.6, 0.8, 0.005), fn: "s.linkState === 'none' || s.lupaPhase === 'laid' || s.lupaPhase === 'releasing'", label: 'lines run only once the magnifier is laid back'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0', label: 'the composition fits (every label placed beside its participant)'},
  {at: times(0.15, 0.7, 0.01), fn: 's.allReached', label: 'the hand stays within the arm'},
]);

const PROPS = ['[data-node="rm-board-body"]', '[data-node^="rm-card-"][data-node$="-body"]', '[data-node^="rm-exhibit"]', '[data-node="rm-clock"]', '[data-node^="rm-exnum"]'];
const CHIPS = ['[data-node^="lab"][data-node$="-body"]'];

textFloorTest(ID);
inFrameTest(ID, {clipped: CHIPS});
noOverlapTest(ID, {markers: ['[data-node="rings"]', ...CHIPS, '[data-node^="rm-p"][data-node$="-head"]', '[data-node^="rm-link-"][data-node$="-m"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {floorFor: FLOOR_FOR});
headsClearTest(ID, {covers: [...CHIPS, '[data-node="rings"] rect', '[data-node="rm-board"]', '[data-node="rm-links"]', '[data-node="rm-lupa-at"]']});
armsClearTest(ID, {props: PROPS});
chipsOwnTest(ID, {at: [0.05, 0.4, 1], maxGap: 72, table: 'none'});
equalWeightTest(ID, {at: [0.1, 1], chips: [['[data-node="rm-card-a"]', '[data-node="rm-card-b"]']], marks: [['[data-node="lg-a"] circle', '[data-node="lg-b"] path:first-of-type'], ['[data-node="rm-card-a-g"]', '[data-node="rm-card-b-g"]'], ['[data-node="rm-link-a0-g"]', '[data-node="rm-link-b0-g"]']]});
neutralityTest(ID);
bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
esSuppliedTagTest(ID);
imConsistencyTest(ID);
glyphSideTest(ID);
noTwinTextTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID, {at: [0.2, 0.3, 0.45, 0.5, 0.62, 0.7, 0.8, 1]});
fillMostTest(ID);
subjectFrameTest(ID, {subject: '[data-node="rm-walls"]'});
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
linesOffTextTest(ID, {lines: ['[data-node^="lab"][data-node$="-lead"]', 'path[data-node^="rm-link-"]']});
textLinesVisibleTest(ID);
placesKeptTest(ID, {walker: true});
linksAnchoredTest(ID);
gluedNumbersTest(ID);
noOneWordLineTest(ID);
noOneSideHighlightTest(ID);

// Item 20: long-labels-stress supplies its state and a hold caption longer than the baseline's — rendered at the hold in
// every ratio, the stress state tag is strictly longer than the default one.
test(`${ID}: long-labels-stress supplies finalState and a hold caption longer than the baseline's (rendered)`, async ({page}) => {
  const stress = presetsFor(ID).find(q => q.name === 'long-labels-stress').params;
  expect(stress.finalState).toBe('located-labelled');
  expect(typeof stress.stateCaption).toBe('string');
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async ([id, stress]) => {
    const def = await window.__lib.load(id);
    const res = [];
    for (const [w, h] of [[1920, 1080], [1080, 1080], [1080, 1920]]) {
      const tag = {};
      for (const [k, params] of [['base', {}], ['stress', stress]]) {
        const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params}); await x.ready; x.seek(x.durationMs);
        const n = x.element.querySelector('[data-node="state-tag"]');
        tag[k] = n ? [...n.querySelectorAll('tspan')].map(q => q.textContent.trim()).filter(Boolean).join(' ').replace(/\s+/g, ' ') : '';
        x.destroy(); el.remove();
      }
      res.push(tag);
    }
    return res;
  }, [ID, stress]);
  for (const t of out) {
    expect(t.stress).toBe(stress.stateCaption);
    expect(t.stress.length).toBeGreaterThan(t.base.length);
  }
});

// The hold never refers to what is not drawn (review-01 fix): for each supplied finalState, in English and Spanish and in
// every preset × ratio, the visible hold text matches the drawing — 'located-only' draws no line and no marker, so no
// visible text speaks of lines or of a label being attached ("Labelled …", "line", "Etiquetado …", "línea") and the
// legend has no ● / ◆ rows; 'located-labelled' draws every line with its marker and keeps the ● / ◆ rows. (Notes and
// state captions an author writes for the labelled state are supplied text and are left out of the located-only run.)
test(`${ID}: for each finalState, no hold text refers to an element that is not drawn (EN and ES, every preset × ratio)`, async ({page}) => {
  test.setTimeout(600000);
  const bad = [];
  for (const finalState of ['located-labelled', 'located-only']) for (const locale of ['en', 'es']) {
    const {bad: b} = await forAll(page, ID, `
      const out = [];
      const tag = pr.name + ' ' + ratio + ' ' + arg.finalState + ' ' + arg.locale;
      // (a fresh instance with the finalState and locale under test on top of the preset)
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      // (a note or state caption the author wrote for the labelled state is the author's text: when the state under test is
      // 'located-only' such custom texts are left out, so the module's own defaults for that state are what is checked;
      // a preset that supplies the default note itself — baseline-es — keeps it)
      const params = {...pr.params, finalState: arg.finalState, locale: arg.locale};
      const DEF = ['Each line ends on a located section (as supplied)', 'Cada línea acaba en un apartado localizado (según lo aportado)'];
      if (arg.finalState === 'located-only') {
        if (params.annotations && !params.annotations.every(a => DEF.includes(a.text))) delete params.annotations;
        delete params.stateCaption;
      }
      const y = (await window.__lib.load('${ID}')).create(el, {width: w, height: h, params});
      await y.ready; y.seek(y.durationMs);
      const sv = y.element;
      const eff3 = e => { let o = 1; for (let z = e; z && z !== sv; z = z.parentNode) { if (!z.getAttribute) continue; if (z.getAttribute('display') === 'none') return 0; const a = z.getAttribute('opacity'); if (a !== null && a !== '') o *= parseFloat(a); } return o; };
      const txt = [...sv.querySelectorAll('text')].filter(t => eff3(t) >= 0.3).map(t => t.textContent).join(' | ');
      const lines = [...sv.querySelectorAll('[data-node^="rm-link-"]')].filter(e => /^rm-link-[ab][0-9]+$/.test(e.dataset.node) && eff3(e) >= 0.3).length;
      const marks = [...sv.querySelectorAll('[data-node^="rm-link-"][data-node$="-m"]')].filter(e => eff3(e) >= 0.3).length;
      const rowsAB = ['lg-a', 'lg-b'].filter(n => sv.querySelector('[data-node="' + n + '"]')).length;
      const s = y.getState({bounds: false}).semantic;
      if (arg.finalState === 'located-only') {
        if (lines || marks) out.push(tag + ': ' + lines + ' lines / ' + marks + ' markers drawn');
        if (/(^|[^a-zà-ú])(lines?|líneas?)([^a-zà-ú]|$)|labelled|etiquetado como|label attached|etiqueta adjunta/i.test(txt.replace(/no label attached|sin etiqueta/gi, ''))) out.push(tag + ': the hold text speaks of lines or attached labels: ' + txt.slice(0, 300));
        if (rowsAB) out.push(tag + ': the legend keeps the ● / ◆ rows');
        if (!s.locK.every(q => q === 1)) out.push(tag + ': not every located section is framed');
      } else {
        const n = s.linksA.length + s.linksB.length;
        if (lines !== n || marks !== n) out.push(tag + ': ' + lines + ' lines / ' + marks + ' markers for ' + n + ' links');
        if (pr.name !== 'default' || !pr.params.textVisibility) if (!rowsAB && sv.querySelector('[data-node="key"]')) out.push(tag + ': the ● / ◆ rows are missing');
      }
      y.destroy(); el.remove();
      void x; void svg;
      return out;`, {finalState, locale});
    bad.push(...b);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

// Item 18 (review-01 fix), rendered: the table and its apartados are the acting objects — at the hold, with the labels
// shown, the table spans >= 0.45 of the frame width at 16:9 and 9:16 (three sections >= 0.44; long-labels-stress, whose
// room also holds two listeners and long cards, >= 0.40) and >= 0.30 at 1:1; a sheet is >= 0.05 of the frame width at
// 16:9 (stress >= 0.045).
test(`${ID}: the table and its sheets are large — rendered share of the frame width at the hold`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    svg.style.width = w + 'px'; svg.style.height = h + 'px';
    x.seek(x.durationMs);
    const F = svg.getBoundingClientRect();
    const tb = svg.querySelector('[data-node="rm-table"]').getBoundingClientRect();
    const sh = svg.querySelector('[data-node="rm-exhibit0"] rect:nth-of-type(2)').getBoundingClientRect();
    const t = tb.width / F.width, e = sh.width / F.width;
    const stress = pr.name === 'long-labels-stress', three = (pr.params.decisions && pr.params.decisions.sections.length === 3);
    const tMin = ratio === '1:1' ? 0.30 : stress ? 0.40 : three ? 0.44 : 0.45;
    stat('table share ' + ratio, Math.round(t * 1000) / 1000);
    stat('sheet share ' + ratio, Math.round(e * 1000) / 1000);
    if (t < tMin) out.push(pr.name + ' ' + ratio + ': table ' + t.toFixed(3) + ' of the frame width < ' + tMin);
    if (ratio === '16:9' && e < (stress ? 0.045 : 0.05)) out.push(pr.name + ' ' + ratio + ': sheet ' + e.toFixed(3) + ' of the frame width');
    return out;`, {});
  report(ID, 'acting objects share', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Equal weight, rendered: the two cards have the same rendered size and text size; every line has the same colour and
// width; at every frame (60 fps) both sides have drawn the same; every located frame is the same shape and ink.
test(`${ID}: the two labels are drawn alike — same card size and text size, same line colour and width, same progress at every frame, one frame style`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    x.seek(x.durationMs);
    const A = box(node(svg, 'rm-card-a-body')), B = box(node(svg, 'rm-card-b-body'));
    if (Math.abs(A.w - B.w) > 0.5 || Math.abs(A.h - B.h) > 0.5) out.push(tag + ': cards ' + A.w.toFixed(1) + 'x' + A.h.toFixed(1) + ' vs ' + B.w.toFixed(1) + 'x' + B.h.toFixed(1));
    const ta = node(svg, 'rm-card-a-text'), tb = node(svg, 'rm-card-b-text');
    if (ta && tb) { const fa = parseFloat(getComputedStyle(ta.querySelector('text')).fontSize) * ta.getScreenCTM().a, fb = parseFloat(getComputedStyle(tb.querySelector('text')).fontSize) * tb.getScreenCTM().a; if (Math.abs(fa - fb) > 0.05) out.push(tag + ': card text ' + fa.toFixed(2) + ' vs ' + fb.toFixed(2)); }
    const st = new Set(nodes(svg, /^rm-link-[ab]\\d+$/).map(l => l.getAttribute('stroke') + '|' + l.getAttribute('stroke-width')));
    if (st.size > 1) out.push(tag + ': line strokes differ ' + [...st].join(' / '));
    const fr = new Set(nodes(svg, /^rm-loc\\d+$/).map(l => { const b = box(l); return Math.round(b.w) + 'x' + Math.round(b.h) + '|' + [...l.querySelectorAll('path')].map(q => q.getAttribute('stroke') + q.getAttribute('stroke-width')).join(); }));
    if (fr.size > 1) out.push(tag + ': located frames differ ' + [...fr].join(' / '));
    let worst = 0;
    for (let ms = 0; ms <= x.durationMs + 1e-6; ms += 1000 / 60) {
      x.seek(ms);
      const s = x.getState({bounds: false}).semantic;
      worst = Math.max(worst, Math.abs(s.drawA.reduce((a, q) => a + q, 0) - s.drawB.reduce((a, q) => a + q, 0)));
    }
    stat('worst progress gap A-B ' + ratio, Math.round(worst * 1000) / 1000, 'max');
    if (worst > 1e-6) out.push(tag + ': the sides are not at the same progress (' + worst + ')');
    return out;`, {}, {withHidden: true});
  report(ID, 'equal sides', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Nothing teleports (rendered, 60 fps): the magnifier's lens and the party move by less than 40 px per frame; the hand
// holds the grip (within 3 px) whenever the magnifier is off its rest; the lens, while carried, stays over the table.
test(`${ID}: the magnifier moves continuously, only in the hand, over the table`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    const tag = pr.name + ' ' + ratio;
    let k = 1;
    let prev = null, worst = 0, off = 0, over = 0;
    for (let ms = 0; ms <= x.durationMs + 1e-6; ms += 1000 / 60) {
      x.seek(ms);
      const s = x.getState({bounds: false}).semantic;
      k = s.pxu;
      const now = [s.lupa, s.party];
      if (prev) now.forEach((q, i) => { worst = Math.max(worst, Math.hypot(q.x - prev[i].x, q.y - prev[i].y) * k); });
      prev = now;
      if (s.carry > 0) {
        off = Math.max(off, Math.hypot(s.hand.x - s.grip.x, s.hand.y - s.grip.y) * k);
        const t = s.tableRect;
        if (s.lupa.x < t.x || s.lupa.x > t.x + t.w || s.lupa.y < t.y || s.lupa.y > t.y + t.h) over++;
      }
    }
    stat('max move px/frame ' + ratio, Math.round(worst), 'max');
    stat('max hand-grip gap ' + ratio, Math.round(off * 10) / 10, 'max');
    if (worst > 40) out.push(tag + ': the magnifier or the party jumps ' + Math.round(worst) + ' px in one frame');
    if (off > 3) out.push(tag + ': the hand leaves the grip by ' + off.toFixed(1) + ' px while the magnifier is carried');
    if (over) out.push(tag + ': the carried lens leaves the table in ' + over + ' frames');
    return out;`, {}, {withHidden: true});
  report(ID, 'magnifier continuity', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});

// The action is recognisable with the labels hidden: the hand takes the magnifier, the lens travels over the table, every
// located apartado gets its frame, every line runs with its marker; nothing written in the room.
test(`${ID}: labels hidden — the magnifier is carried over the apartados, the located ones are framed, every line runs with its marker; no text`, async ({page}) => {
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
    x.seek(0.2 * x.durationMs); const h1 = x.getState({bounds: false}).semantic;
    x.seek(0.3 * x.durationMs); const h2 = x.getState({bounds: false}).semantic;
    x.seek(x.durationMs);
    const lines = [...svg.querySelectorAll('[data-node^="rm-link-"]')].filter(e => /^rm-link-[ab]\d+$/.test(e.getAttribute('data-node')));
    const marks = [...svg.querySelectorAll('[data-node^="rm-link-"]')].filter(e => /-m$/.test(e.getAttribute('data-node')));
    const frames = [...svg.querySelectorAll('[data-node^="rm-loc"]')];
    return {raised: Math.hypot(h1.hand.x - h0.hand.x, h1.hand.y - h0.hand.y), lupaMoved: Math.hypot(h2.lupa.x - h0.lupa.x, h2.lupa.y - h0.lupa.y), frames: frames.map(op), lines: lines.map(op), marks: marks.map(op), text: [...svg.querySelectorAll('[data-layer="scene"] text')].filter(t => op(t) > 0.05 && t.textContent.trim()).length};
  }, ID);
  expect(out.raised).toBeGreaterThan(10);
  expect(out.lupaMoved).toBeGreaterThan(40);
  expect(out.frames.length).toBe(2);
  expect(Math.min(...out.frames)).toBeGreaterThan(0.95);
  expect(out.lines.length).toBe(2);
  expect(Math.min(...out.lines)).toBeGreaterThan(0.95);
  expect(Math.min(...out.marks)).toBeGreaterThan(0.95);
  expect(out.text).toBe(0);
});

// Item 12 (review-01 fix): the magnifier laid back rests clear of the sheets, the located frames and the markers.
lupaParkedClearTest(ID, {rooms: ['rm'], gap: 2});
