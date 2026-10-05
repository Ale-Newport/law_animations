// LAW-0462 — Consideration como concepto · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends at its element (each token's line starts and ends on the lanes' event
// ticks and meets the card's edge; the relation between the tokens ends at both cards), the order does not change when
// seeking, and a relation is never drawn as causality by default (plain relations carry no arrowhead; nothing is causal
// unless supplied). Legal content: the relation between the promise token and the performance token is captioned
// "linked as supplied" — a plain relation, no validity; "consideration" appears only as the supplied, illustrative
// concept label; no rule, validity, enforceability, binding force, sufficiency, adequacy or formation wording
// (noDeadlineWords, EN and ES).
// Standing coordinator rule (item 20): the long-labels-stress capped fields (each still longer than baseline, every
// count kept) are listed with the true driver and rendered numbers in the preset's description; pre-cap values in
// LAW-0462.presets.precap.json.
// Windows (LAW-0462.js W): separate 0.02–0.17 · relate 0.18–0.43 · trace 0.45–0.74 · gather 0.76–0.88 · key 0.88–0.93.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, noDeadlineWords, cardsApart, conceptNeutral} from './cf06-rendered.js';

const ID = 'LAW-0462';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ORDER = 'JSON.stringify(s.visitOrder)';
// (test-only: both tokens sent with one position — one shared time coordinate on the two lanes)
const SAME = {sequence: [
  {event: 'promise-sent', time: 'Day 1, 09:00 (fictional)', position: 1},
  {event: 'performance-sent', time: 'Day 1, 09:00 (fictional)', position: 1},
  {event: 'promise-received', time: 'Day 1, 11:00 (fictional)'},
  {event: 'performance-received', time: 'Day 1, 11:30 (fictional)'},
]};
const EXTRA = [{name: 'test-sent-together', params: SAME}];

contractSuite(ID, {
  continuity: ['tracer', 'cardP', 'cardR'],
  semantic: [
    {at: 0, fn: 's.separated === 0 && s.relationsDrawn.every(v => v === 0) && !s.tracerVisible', label: 'separate: nothing related yet'},
    {at: 0.18, fn: 's.separated === 1 && s.relationsDrawn.every(v => v === 0)', label: 'the parts are apart before any relationship is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(v => v > 0) && s.relationsDrawn.some(v => v < 1)', label: 'relationships are drawn one by one'},
    {at: 0.44, fn: 's.relationsDrawn.every(v => v === 1) && !s.tracerVisible', label: 'all supplied relationships exist before the tracer moves'},
    {at: 0.5, fn: "!s.relationKinds.includes('causal') && s.relationKinds.includes('relation') && s.arrows.every(a => a.kind === 'relation' ? !a.arrow : true)", label: 'the link between the tokens is a plain relation: no arrowhead; nothing causal unless supplied'},
    {at: 0.62, fn: "s.tracerVisible && JSON.stringify(s.visitOrder.slice(0, 3)) === JSON.stringify(['partyA','promise','performance'])", label: 'the tracer follows the supplied order'},
    {at: 0.95, fn: `${ORDER} === JSON.stringify(['partyA','promise','performance','partyB','performance','partyA'])`, label: 'the visiting order is the same after seeking elsewhere'},
    {at: 0.3, fn: `${ORDER} === '[]'`, label: 'seeking back: nothing visited before the trace beat'},
    {at: 1, fn: "s.layoutOk && s.linesCross && s.cardP && s.cardR && JSON.stringify(s.order) === JSON.stringify(['promise-sent','performance-sent','promise-received','performance-received'])", label: 'gather: both tokens, the lines cross, the supplied order kept'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.layoutOk && s.order[0] === 'performance-sent' && s.relationKinds.includes('relation') && s.arrows.every(a => a.kind === 'relation' ? !a.arrow : true)", label: 'alternative: the performance token first; the relation supplied the other way is still plain'},
    {at: 1, params: P('long-labels-stress'), fn: "s.layoutOk && s.grouped && s.relationKinds.includes('relation')", label: 'stress: the receipts share one position; the plain relation'},
    {at: 0.5, params: {relationships: [{from: 'performance', to: 'promise', kind: 'causal'}]}, fn: "s.relationKinds.length === 1 && s.relationKinds[0] === 'causal'", label: 'a causal style appears only when supplied'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.relationsDrawn.every(v => v === 1) && s.linesCross', label: 'labels hidden: the same mechanism'},
  ],
});

ratioChecks(ID, 'layout fits, captions placed, every connector lands', [
  {at: [1], fn: 's.layoutOk', label: 'every card, chip and caption found a clear place'},
]);

suppliedTextSuite(ID, {
  // (B's commitment, its card and its element label are drawn only when the supplied sequence has B's commitment)
  fields: 'const b = p.sequence.some(e => e.event.startsWith("performance")); return [p.offer.reference, p.offer.title, ...p.terms.map(t => `${t.label}: ${t.value}`), ...(b ? [p.responses[0].reference, p.responses[0].text] : []), ...p.sequence.map(e => e.time), ...p.parties.map(q => q.name), ...p.elements.filter(e => b || e.id !== "performance").map(e => e.label), ...[...new Set(p.relationships.map(q => q.kind))].map(k => p.relationLabels[k]), p.conceptLabel]',
  content: 'const b = p.sequence.some(e => e.event.startsWith("performance")); return [p.offer.title, ...p.terms.map(t => `${t.label}: ${t.value}`), ...(b ? [p.responses[0].text] : []), ...p.sequence.map(e => e.time)]',
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
noTextOverProps(ID, ['[data-node="card-p"]', '[data-node="card-r"]']);
seekHistory(ID);
fill(ID, [0.3, 1], {short: 0.5});
headFloor(ID);
esDefaults(ID);
noDeadlineWords(ID);
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
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
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
