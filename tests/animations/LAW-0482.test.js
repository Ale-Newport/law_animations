// LAW-0482 — Cláusula incorporada · mechanism. Contract battery + ID-specific checks.
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// the clauses list, schedules, definitions and priorities. The motif's core content — one placeholder clause slip, the
// auxiliary document and the contract set, and where the slip ends — stays editable (test-comment note only).
// acceptanceCheck (brief): every connector ends at its element (each document's line starts and ends on the lanes'
// event ticks and meets the document's edge), the order does not change when seeking, and a relation is never drawn as
// causality by default (nothing is causal unless supplied). With the supplied configuration "clause linked" the clause
// slip passes from the auxiliary document's dock into the contract set's once the relationships are being drawn; with
// "external text" it stays. Legal content (very high risk): the clause is a placeholder; both configurations are neutral
// and of equal weight — the same footer chip at the gather, nothing about the people changes (configNeutral); no
// incorporation rule and no conclusion (noIncorporationRuleWords, EN and ES); no jurisdiction (conceptNeutral).
// Windows (LAW-0482.js W): separate 0.02–0.17 · relate 0.18–0.43 (the slip's print fades 0.35–0.365, it passes
// 0.365–0.42, its print returns 0.42–0.435) · trace 0.45–0.74 · gather 0.76–0.88 (configuration chip 0.78–0.82) · key
// 0.88–0.93.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, noIncorporationRuleWords, configNeutral, cardsApart, conceptNeutral, INCORPORATION_BANNED, LINK_LABEL, docSize} from './cf11-rendered.js';

const ID = 'LAW-0482';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ORDER = 'JSON.stringify(s.visitOrder)';
const ROW = "(String(t.value).startsWith('(') ? t.label + ' ' + t.value : t.label + ': ' + t.value)";
// (test-only: both documents sent with one position — one shared time coordinate on the two lanes, order to be examined)
const SAME = {sequence: [
  {event: 'doc-sent', time: 'Day 1, 10:00 (fictional)', position: 1},
  {event: 'set-sent', time: 'Day 1, 10:00 (fictional)', position: 1},
  {event: 'doc-received', time: 'Day 1, 10:01 (fictional)'},
  {event: 'set-received', time: 'Day 1, 10:06 (fictional)'},
]};
const EXTRA = [{name: 'test-sent-together', params: SAME}];

contractSuite(ID, {
  continuity: ['tracer', 'cardP', 'cardR'],
  semantic: [
    {at: 0, fn: "s.separated === 0 && s.relationsDrawn.every(v => v === 0) && !s.tracerVisible && s.slipOn === 'document'", label: 'separate: nothing related yet; the slip in the auxiliary document\'s dock'},
    {at: 0.18, fn: 's.separated === 1 && s.relationsDrawn.every(v => v === 0)', label: 'the parts are apart before any relationship is drawn'},
    {at: 0.3, fn: "s.relationsDrawn.some(v => v > 0) && s.relationsDrawn.some(v => v < 1) && s.slipOn === 'document'", label: 'relationships are drawn one by one; the slip has not moved'},
    {at: 0.39, fn: "s.slipOn === 'moving' && s.relationsDrawn.filter(v => v === 1).length >= 2", label: 'the slip passes once both documents\' journeys are drawn'},
    {at: 0.44, fn: "s.relationsDrawn.every(v => v === 1) && !s.tracerVisible && s.slipOn === 'set'", label: 'all supplied relationships exist and the slip lies in the contract set before the tracer moves'},
    {at: 0.5, fn: "!s.relationKinds.includes('causal')", label: 'nothing causal unless supplied'},
    {at: 0.66, fn: "s.tracerVisible && JSON.stringify(s.visitOrder.slice(0, 3)) === JSON.stringify(['partyA','document','partyB'])", label: 'the tracer follows the supplied order'},
    {at: 0.95, fn: `${ORDER} === JSON.stringify(['partyA','document','partyB','set','partyA'])`, label: 'the visiting order is the same after seeking elsewhere'},
    {at: 0.3, fn: `${ORDER} === '[]'`, label: 'seeking back: nothing visited before the trace beat'},
    {at: 1, fn: "s.layoutOk && s.cardP && s.cardR && s.status === 'clause-linked' && s.configShown === 1 && s.slipOn === 'set' && JSON.stringify(s.order) === JSON.stringify(['doc-sent','doc-received','set-sent','set-received'])", label: 'gather: the supplied order kept; clause linked as supplied (the slip in the set)'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.layoutOk && s.order[0] === 'doc-sent' && s.status === 'external-text' && s.slipOn === 'document' && s.configShown === 1 && !s.relationKinds.includes('causal')", label: 'alternative: external text as supplied (the slip stays in the auxiliary document)'},
    {at: 0.7, params: P('contrast-or-alternative'), fn: 's.configShown === 0', label: 'the configuration chip comes only at the gather'},
    {at: 1, params: P('long-labels-stress'), fn: "s.layoutOk && s.slipOn === 'set'", label: 'stress: long labels; the slip in the contract set'},
    {at: 1, params: SAME, fn: 's.layoutOk && s.grouped', label: 'a shared position is drawn as one time coordinate (order to be examined)'},
    {at: 0.5, params: {relationships: [{from: 'set', to: 'document', kind: 'causal'}]}, fn: "s.relationKinds.length === 1 && s.relationKinds[0] === 'causal'", label: 'a causal style appears only when supplied'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.relationsDrawn.every(v => v === 1) && s.slipOn === 'set'", label: 'labels hidden: the same mechanism'},
  ],
});

ratioChecks(ID, 'layout fits, captions placed, every connector lands', [
  {at: [1], fn: 's.layoutOk', label: 'every device, chip and caption found a clear place'},
]);

suppliedTextSuite(ID, {
  // (B's contract set and its element label are drawn only when the supplied sequence has the set's journey)
  fields: `const b = p.sequence.some(e => e.event.startsWith("set")); return [p.document.reference, p.document.title, p.clause.label + ' ' + p.clause.value, ...(b ? [p.contractSet.reference, p.contractSet.title] : []), ...p.sequence.map(e => e.time), ...p.parties.map(q => q.name), ...p.elements.filter(e => b || e.id !== "set").map(e => e.label), ...[...new Set(p.relationships.map(q => q.kind))].map(k => p.relationLabels[k])]`,
  content: `const b = p.sequence.some(e => e.event.startsWith("set")); return [p.document.title, p.clause.label + ' ' + p.clause.value, ...(b ? [p.contractSet.title] : []), ...p.sequence.map(e => e.time)]`,
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

// Rendered: every relation caption sits within 40 px (1080p) of its own connector and at least 20 px nearer to it than to
// any other connector; no other connector runs through it; every connector runs at least three caption line-heights. Every
// preset × ratio, at the end state.
test(`${ID}: captions sit on their own connectors; no stub connectors (rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [], rows = [];
    for (const pr of presets) {
      for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        x.seek(x.durationMs);
        const svg = x.element;
        const k = 1080 / Math.min(w, h) * (w / svg.getBoundingClientRect().width);
        const paths = {};
        for (const pth of svg.querySelectorAll('[data-conn]')) {
          const m = pth.getScreenCTM();
          const L = pth.getTotalLength();
          const pts = [];
          for (let i = 0; i <= 40; i++) { const q = pth.getPointAtLength(L * i / 40); pts.push(new DOMPoint(q.x, q.y).matrixTransform(m)); }
          paths[pth.getAttribute('data-conn')] = {pts, len: L * Math.hypot(m.a, m.b)};
        }
        const dist = (b, pts) => {
          let best = Infinity;
          for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i], c = pts[i + 1];
            for (const q of [{x: b.left, y: b.top}, {x: b.right, y: b.top}, {x: b.left, y: b.bottom}, {x: b.right, y: b.bottom}, {x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2}]) {
              const dx = c.x - a.x, dy = c.y - a.y, L2 = dx * dx + dy * dy || 1;
              const t = Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / L2));
              best = Math.min(best, Math.hypot(q.x - (a.x + dx * t), q.y - (a.y + dy * t)));
            }
            // a path through the box is at distance 0
            for (let j = 0; j <= 10; j++) { const q = {x: a.x + (c.x - a.x) * j / 10, y: a.y + (c.y - a.y) * j / 10}; if (q.x > b.left && q.x < b.right && q.y > b.top && q.y < b.bottom) best = 0; }
          }
          return best;
        };
        for (const cap of svg.querySelectorAll('[data-caption-of]')) {
          const own = cap.getAttribute('data-caption-of').split(' ');
          const b = cap.getBoundingClientRect();
          const tx = cap.querySelector('text');
          const tm = tx.getScreenCTM();
          const lh = parseFloat(getComputedStyle(tx).fontSize) * Math.hypot(tm.a, tm.b) * 1.18; // screen px
          const dOwn = Math.min(...own.map(i => dist(b, paths[i].pts)));
          const dOther = Math.min(Infinity, ...Object.keys(paths).filter(i => !own.includes(i)).map(i => dist(b, paths[i].pts)));
          rows.push(`${pr.name} ${ratio} cap${own[0]} own ${(dOwn * k).toFixed(0)}px other ${(dOther * k).toFixed(0)}px`);
          if (dOwn * k > 40) fails.push(`${pr.name} ${ratio} cap${own[0]} ${(dOwn * k).toFixed(0)} px from its connector`);
          if ((dOther - dOwn) * k < 20) fails.push(`${pr.name} ${ratio} cap${own[0]} not ≥ 20 px nearer its own connector (own ${(dOwn * k).toFixed(0)}, other ${(dOther * k).toFixed(0)})`);
          for (const i of own) if (paths[i].len < lh * 3) fails.push(`${pr.name} ${ratio} connector ${i} shorter than 3 caption lines (${(paths[i].len * k).toFixed(0)} px)`);
        }
        x.destroy();
        el.remove();
      }
    }
    return {fails, rows};
  }, [ID, presets]);
  console.log(out.rows.join('\n'));
  expect(out.fails.slice(0, 20), `${out.fails.length} caption faults`).toEqual([]);
});

textFloor(ID);
noTextOverlap(ID);
// (the clause slip in flight is an opaque object passing over the documents' own print for ~0.4 s, its own print
// faded out: it is not a free label, so it is not listed here — noTextOverlap still covers every text)
noTextOverProps(ID, ['[data-node="card-p"]', '[data-node="card-r"]']);
seekHistory(ID);
fill(ID, [0.3, 1], {short: 0.5});
headFloor(ID);
esDefaults(ID);
noIncorporationRuleWords(ID);
configNeutral(ID, [[{status: 'clause-linked'}, {status: 'external-text'}], [{...P('contrast-or-alternative'), status: 'clause-linked'}, P('contrast-or-alternative')]], [''], ['badge0', 'badge1']);
// (the documents drawn as documents: at rest in the diagram and at the gather)
docSize(ID, {cards: '^card-[pr]$', times: [0.3, 0.6, 1]});
conceptNeutral(ID);
cardsApart(ID, [['card-p', 'card-r']]);

// Rendered: no connector runs under a text (headings, time labels, names, other captions, card text) — every preset ×
// ratio, at the hold; a caption may sit on its own connector.
test(`${ID}: no connector runs under a text (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let checked = 0;
    for (const pr of presets) {
      for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        x.seek(x.durationMs);
        const svg = x.element;
        const vis = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o >= 0.05; };
        const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && vis(t) && !t.closest('[data-layer="content-notice"]'));
        for (const pth of svg.querySelectorAll('[data-conn]')) {
          const id = pth.getAttribute('data-conn');
          const m = pth.getScreenCTM();
          const L = pth.getTotalLength();
          for (const t of texts) {
            const cap = t.closest('[data-caption-of]');
            if (cap && cap.getAttribute('data-caption-of').split(' ').includes(id)) continue;
            const b = t.getBoundingClientRect();
            for (let i = 2; i <= 98; i++) {
              const q = new DOMPoint(pth.getPointAtLength(L * i / 100).x, pth.getPointAtLength(L * i / 100).y).matrixTransform(m);
              checked++;
              if (q.x > b.left + 1 && q.x < b.right - 1 && q.y > b.top + 1 && q.y < b.bottom - 1) { fails.push(`${pr.name} ${ratio} connector ${id} under "${t.textContent.trim().slice(0, 24)}"`); break; }
            }
          }
        }
        x.destroy();
        el.remove();
      }
    }
    return {fails: [...new Set(fails)], checked};
  }, [ID, presets]);
  expect(out.checked).toBeGreaterThan(1000);
  expect(out.fails.slice(0, 20)).toEqual([]);
});

// Rendered: events supplied with one position share the identical time coordinate — their ●/◆ ticks sit at the same
// along-lane position (± 1 px), and so do their time chips' centres; nothing implies an order between them.
test(`${ID}: same-time ticks and chips share the time coordinate (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID), ...EXTRA];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let groups = 0;
    for (const pr of presets) for (const tv of ['all', 'key', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      x.seek(x.durationMs);
      const svg = x.element;
      const k = w / svg.getBoundingClientRect().width;
      const s = x.getState({bounds: false}).semantic;
      const ax = s.timeAxis;
      const c = b => (ax === 'x' ? (b.left + b.right) / 2 : (b.top + b.bottom) / 2);
      for (const g of s.sameTime) {
        groups++;
        const ticks = g.map(i => svg.querySelector(`[data-node="ev${i}"]`).firstElementChild.getBoundingClientRect());
        const tc = ticks.map(c);
        if ((Math.max(...tc) - Math.min(...tc)) * k > 1) fails.push(`${pr.name} ${tv} ${ratio} ticks ${tc.map(v => (v * k).toFixed(1)).join('/')}`);
        if (tv === 'all' && ax === 'x') {
          const chips = g.map(i => [...svg.querySelector(`[data-node="ev${i}"]`).querySelectorAll('path')].map(e => e.getBoundingClientRect()).sort((a, b) => b.width * b.height - a.width * a.height)[0]).filter(Boolean);
          const cc = chips.map(c);
          if ((Math.max(...cc) - Math.min(...cc)) * k > 1) fails.push(`${pr.name} ${tv} ${ratio} chips ${cc.map(v => (v * k).toFixed(1)).join('/')}`);
        }
        if (tv === 'all' && ax === 'y') {
          const chips = g.map(i => [...svg.querySelector(`[data-node="ev${i}"]`).querySelectorAll('path')].map(e => e.getBoundingClientRect()).sort((a, b) => b.width * b.height - a.width * a.height)[0]).filter(Boolean);
          const cc = chips.map(c);
          if ((Math.max(...cc) - Math.min(...cc)) * k > 1) fails.push(`${pr.name} ${tv} ${ratio} chips not level ${cc.map(v => (v * k).toFixed(1)).join('/')}`);
        }
      }
      x.destroy();
      el.remove();
    }
    return {fails, groups};
  }, [ID, presets]);
  expect(out.groups).toBeGreaterThan(0);
  expect(out.fails.slice(0, 20)).toEqual([]);
});

// Rendered: at a shared position each message line (path and arrowhead) keeps ≥ 8 px from the OTHER message's tick —
// every line reaches its own tick from its own side (every preset × ratio × labels state, at the hold).
test(`${ID}: each line keeps clear of the other message's same-time tick (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID), ...EXTRA];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [], worst = {};
    for (const pr of presets) for (const tv of ['all', 'key', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      x.seek(x.durationMs);
      const svg = x.element;
      const k = w / svg.getBoundingClientRect().width;
      const s = x.getState({bounds: false}).semantic;
      for (const g of s.sameTime) {
        const ticks = g.map(i => svg.querySelector(`[data-node="ev${i}"]`).firstElementChild);
        if (ticks.length < 2) continue;
        for (const t of ticks) {
          const m = t.tagName === 'circle' ? 'proposal' : 'response';
          const other = ticks.find(o2 => o2 !== t);
          const ob = other.getBoundingClientRect();
          const oc = {x: (ob.left + ob.right) / 2, y: (ob.top + ob.bottom) / 2}, orad = Math.max(ob.width, ob.height) / 2;
          const pth = svg.querySelector(`[data-node="line-${m}-p"]`);
          const cm = pth.getScreenCTM();
          const L = pth.getTotalLength();
          let mn = Infinity;
          for (let j = 0; j <= 400; j++) { const p0 = pth.getPointAtLength(L * j / 400); const q = new DOMPoint(p0.x, p0.y).matrixTransform(cm); mn = Math.min(mn, Math.hypot(q.x - oc.x, q.y - oc.y) - orad - 2.5); }
          const hb = svg.querySelector(`[data-node="line-${m}-head"]`).getBoundingClientRect();
          const hd = Math.max(hb.left - ob.right, ob.left - hb.right, hb.top - ob.bottom, ob.top - hb.bottom);
          mn = Math.min(mn, hd) * k;
          const key = `${pr.name} ${tv} ${ratio} ${m}`;
          worst[key] = Math.round(mn * 10) / 10;
          if (mn < 8) fails.push(`${key}: ${mn.toFixed(1)} px from the other tick`);
        }
      }
      x.destroy();
      el.remove();
    }
    return {fails, worst};
  }, [ID, presets]);
  console.log(JSON.stringify(out.worst));
  expect(Object.keys(out.worst).length).toBeGreaterThan(0);
  expect(out.fails.slice(0, 20)).toEqual([]);
});

// The supplied parameters of every preset carry no banned wording either (EN and ES).
test(`${ID}: no preset supplies incorporation-rule, outcome or obligation wording (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) {
    expect(JSON.stringify(pr.params).match(INCORPORATION_BANNED), pr.name).toBeNull();
    for (const t of [...(pr.params.elements || []).map(e => e.label), ...Object.values(pr.params.relationLabels || {})]) expect(t, pr.name).not.toMatch(LINK_LABEL);
  }
});

// Rendered (review fix): a time label never wraps between the number and its unit — no rendered line starts with the
// unit alone (every preset × ratio, labels on, at the hold).
test(`${ID}: a time never wraps away from its unit (rendered)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const bad = [];
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      x.seek(x.durationMs);
      for (const t of x.element.querySelectorAll('text, tspan')) { const q = t.textContent.trim(); if (/^(h|min|s)(\s|\(|$)/.test(q) && t.children.length === 0) bad.push(`${pr.name} ${ratio} "${q}"`); }
      x.destroy();
      el.remove();
    }
    return bad;
  }, [ID, presets]);
  expect(out).toEqual([]);
});

// (no read-across rail here: the motif's documents carry no rows under a cover; the clause slip in its dock is the
// changing part — see the semantic checks above)
