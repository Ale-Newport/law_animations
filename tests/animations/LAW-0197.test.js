// LAW-0197 — Reunión de equipo jurídico · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion, anchoring of objects, and a transformation that
// stays recognisable with labels hidden (checked on semantic state, which does not depend on text).
// Act windows (LAW-0197.js actWindows): three supplied links over 0.15–0.73, D = 0.58/3 = 0.1933:
//   a 0.150–0.343 · b 0.343–0.537 · c 0.537–0.730. Inside an act q = (u − start)/D: lift 0–0.62,
//   press 0.62–0.72 (lands at 0.67), release 0.72–1. The magnet rides the hand from u = 0 until
//   q = 0.72 (a 0.289 · b 0.483 · c 0.676) and lies in its slot from then on.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0197';
const BASE = ['baseline-illustrative', 'contrast-or-alternative', 'baseline-es'];

contractSuite(ID, {
  continuity: ['handA', 'handB', 'handC', 'magA', 'magB', 'magC', 'freeA', 'freeB', 'freeC'],
  attach: [
    // each magnet is carried from the SOLVED hand (hand on the grip point of its rim) until it is pressed in
    {from: 0, to: 0.288, a: 'handA', b: 'gripA', tol: 1.5},
    {from: 0, to: 0.482, a: 'handB', b: 'gripB', tol: 1.5},
    {from: 0, to: 0.675, a: 'handC', b: 'gripC', tol: 1.5},
    // after the press the magnet stays exactly in its card's slot
    {from: 0.291, to: 1, a: 'magA', b: 'slotA', tol: 0.5},
    {from: 0.485, to: 1, a: 'magB', b: 'slotB', tol: 0.5},
    {from: 0.678, to: 1, a: 'magC', b: 'slotC', tol: 0.5},
  ],
  semantic: [
    {at: 0, fn: "s.at.every(a => a === 'hand') && s.landed.every(v => v === 0) && s.bubble === 0 && s.beat === 'rest'", label: 'rest: every person holds their own magnet; every slot is empty'},
    {at: 0.14, fn: "s.slotsFilled.every(v => v === 0) && s.active === null", label: 'nothing is linked before the action beat'},
    {at: 0.22, fn: "s.active === 'a' && s.at[0] === 'hand' && s.looks[1] < 0 && s.looks[2] < 0", label: 'A raises the magnet; B and C turn to watch'},
    {at: 0.3, fn: "s.at[0] === 'card' && s.landed[0] === 1 && JSON.stringify(s.slotsFilled) === '[1,0,0]'", label: 'A’s link has landed in A’s card slot by the middle of the action beat'},
    {at: 0.37, fn: "s.bubble === 1 && s.at[1] === 'hand'", label: 'A asks the supplied question after linking, before B has placed a magnet'},
    {at: 0.45, fn: "s.active === 'b' && s.looks[0] > 0 && s.looks[2] < 0", label: 'B links next; A and C watch B'},
    {at: 0.52, fn: "JSON.stringify(s.slotsFilled) === '[1,1,0]'", label: 'B’s link lands before C starts'},
    {at: 0.8, fn: "s.slotsFilled.every(v => v === 1) && s.at.every(a => a === 'card') && s.beat === 'hold'", label: 'main action complete by about 0.8: every supplied link placed'},
    {at: 1, fn: "s.allReached && !s.overHeads && s.magGap >= 0 && s.labelsFit && s.order === 'a>b>c'", label: 'hold: hands on their targets, no magnet/card/bubble over a head, layout fits'},
    {at: 1, params: {finalState: 'last-link-pending'}, fn: "s.at[2] === 'hand' && JSON.stringify(s.slotsFilled) === '[1,1,0]'", label: 'supplied final state: the last link is still pending in C’s hand'},
    {at: 1, params: {relationships: [{from: 'c', to: 't3', kind: 'relation'}, {from: 'a', to: 't1', kind: 'relation'}]}, fn: "s.order === 'c>a' && s.at[1] === 'hand' && JSON.stringify(s.slotsFilled) === '[1,0,1]'", label: 'two supplied links: the middle task keeps an empty slot and B keeps the magnet'},
    {at: 0.25, params: {relationships: [{from: 'c', to: 't3', kind: 'relation'}, {from: 'a', to: 't1', kind: 'relation'}]}, fn: "s.active === 'c' && s.at[0] === 'hand'", label: 'the acting order follows the supplied relationships'},
    {at: 1, params: {relationships: [{from: 'a', to: 't2', kind: 'relation'}]}, fn: "JSON.stringify(s.lanes) === JSON.stringify(['t2','t1','t3']) && JSON.stringify(s.slotsFilled) === '[1,0,0]'", label: 'a linked task is pinned in its person’s lane'},
    {at: 0.3, params: {textVisibility: 'none'}, fn: "s.at[0] === 'card' && s.landed[0] === 1", label: 'labels hidden: the same link lands at the same time'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.at[2] === 'hand'", label: 'actionProgress freezes the action part-way'},
  ],
});

// Every preset × ratio × labels shown / hidden: no magnet, card or bubble ever covers a head (dense), every
// hand reaches its target, and people stay large (face diameter in px at 1080p ≥ the accepted references:
// LAW-0171 ≤ 101 / 90 / 66, LAW-0163 115 / 115 / 77 in 16:9 / 9:16 / 1:1).
ratioChecks(ID, 'magnets, cards and bubble clear of heads; reach; person size', [
  {at: times(0, 1, 0.01), fn: '!s.overHeads && s.magGap >= 0 && s.allReached', label: 'nothing over a head at any time; every hand reaches'},
  {at: [1], ratios: ['16:9'], presets: BASE, fn: 's.headPx >= 104', label: 'face ≥ 104 px (16:9)'},
  {at: [1], ratios: ['9:16'], presets: BASE, fn: 's.headPx >= 108', label: 'face ≥ 108 px (9:16)'},
  {at: [1], ratios: ['1:1'], presets: BASE, fn: 's.headPx >= 77', label: 'face ≥ 77 px (1:1)'},
  // long labels: people stay at least as large as in the accepted LAW-0171 (83 / 74 / 55 px)
  {at: [1], ratios: ['16:9'], presets: ['long-labels-stress'], fn: 's.headPx >= 83', label: 'long labels: face ≥ 83 px (16:9)'},
  {at: [1], ratios: ['9:16'], presets: ['long-labels-stress'], fn: 's.headPx >= 74', label: 'long labels: face ≥ 74 px (9:16)'},
  {at: [1], ratios: ['1:1'], presets: ['long-labels-stress'], fn: 's.headPx >= 55', label: 'long labels: face ≥ 55 px (1:1)'},
  {at: [1], fn: 's.labelsFit', label: 'layout fits without cut text'},
]);

// Rendered: no hand or arm segment of any person covers visible text (sampled along each drawn arm line with its
// stroke half-width, and over each hand's box), every preset × ratio at dense times.
const HANDS_CLEAR_OF_TEXT = `(() => {
  const vis = e => { for (let q = e; q && q !== svg; q = q.parentElement) { const o = q.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.05) return false; if (q.getAttribute('display') === 'none') return false; } return true; };
  const texts = [...svg.querySelectorAll('text tspan, text')].filter(t => (t.tagName === 'tspan' || !t.querySelector('tspan')) && (t.textContent || '').trim() && vis(t) && !t.closest('[data-layer="content-notice"]') && !t.closest('[data-node="lz"]'))
    .map(t => ({el: t, r: t.getBoundingClientRect()})).filter(q => q.r.width > 1).map(q => ({el: q.el, l: q.r.left + 1, t: q.r.top + 1, r: q.r.right - 1, b: q.r.bottom - 1}));
  // only a limb painted AFTER the text (on top of it) covers it
  let limb = null;
  const inT = (x, y, pad) => texts.some(b => x > b.l - pad && x < b.r + pad && y > b.t - pad && y < b.b + pad && (b.el.compareDocumentPosition(limb) & Node.DOCUMENT_POSITION_FOLLOWING));
  for (const ln of svg.querySelectorAll('line[data-node]')) {
    const nm = ln.getAttribute('data-node');
    if (!/^st-p\\d-[lr]-(u|l)$/.test(nm) || !vis(ln)) continue;
    limb = ln;
    const m = ln.getScreenCTM();
    const A = new DOMPoint(+ln.getAttribute('x1'), +ln.getAttribute('y1')).matrixTransform(m), B = new DOMPoint(+ln.getAttribute('x2'), +ln.getAttribute('y2')).matrixTransform(m);
    const half = parseFloat(ln.getAttribute('stroke-width')) * Math.abs(m.a) / 2;
    for (let i = 0; i <= 20; i++) { const x = A.x + (B.x - A.x) * i / 20, y = A.y + (B.y - A.y) * i / 20; if (inT(x, y, half)) return false; }
  }
  for (const hd of svg.querySelectorAll('[data-node$="-hand"]')) {
    if (!/^st-p\\d-[lr]-hand$/.test(hd.getAttribute('data-node')) || !vis(hd)) continue;
    limb = hd;
    const r = hd.getBoundingClientRect();
    const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
    if (inT(cx, cy, Math.min(r.width, r.height) * 0.35)) return false;
  }
  return true;
})()`;
ratioChecks(ID, 'hands and arms never cover text (rendered)', [
  {at: times(0, 1, 0.02), tv: ['all'], dom: HANDS_CLEAR_OF_TEXT, label: 'rendered: no arm or hand over any visible text'},
]);

// arms and magnets of neighbours never touch (rest pose included)
ratioChecks(ID, 'neighbours clear', [
  {at: times(0, 1, 0.02), fn: 's.armGap >= 0 && s.magArmGap >= 0', label: 'no arm crosses a neighbour’s arm; no magnet over a neighbour’s arm'},
]);

suppliedTextSuite(ID, {
  fields: `const ids = ['a','b','c'];
    const linked = new Set(p.relationships.map(q => q.from));
    const open = ids.some((id, i) => !linked.has(id)) || p.finalState === 'last-link-pending';
    return [...p.actors.map(a => a.name), ...ids.map((id, i) => p.actorLabels[id] || p.roles[id] || p.actors[i].role), ...p.props.tasks,
      open ? p.props.openSlot : null, p.props.speech, p.objectLabels.board, p.objectLabels.document, ...p.annotations.map(a => a.text)]`,
  content: 'return [...p.actors.map(a => a.name), ...p.props.tasks, p.props.speech]',
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

// Rendered (DOM) check: no task card, magnet or speech bubble box overlaps a face circle, at dense times in every
// preset × ratio × labels shown / hidden.
test.describe(`${ID} faces clear (rendered)`, () => {
  test(`${ID}: no card, magnet or bubble box covers a face (dense, every preset × ratio × labels)`, async ({page}) => {
    test.setTimeout(240000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
        for (const tv of ['all', 'none']) {
          for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
            const el = document.createElement('div');
            document.getElementById('slots').appendChild(el);
            const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
            await x.ready;
            const svg = x.element;
            const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentElement) { const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
            for (let u = 0; u <= 1.0001; u += 0.02) {
              x.seek(u * x.durationMs);
              const faces = [...svg.querySelectorAll('[data-node$="-head"]')].map(g => [...g.querySelectorAll(':scope > circle')].sort((a, b) => b.r.baseVal.value - a.r.baseVal.value)[0]).filter(Boolean).map(c => { const r = c.getBoundingClientRect(); return {cx: r.left + r.width / 2, cy: r.top + r.height / 2, rad: r.width / 2}; });
              const objs = [
                ...[...svg.querySelectorAll('[data-node^="st-card"]')].filter(e => /^st-card\d$/.test(e.getAttribute('data-node'))),
                ...[...svg.querySelectorAll('[data-node^="st-m"]')].filter(e => /^st-m\d$/.test(e.getAttribute('data-node'))),
              ].filter(e => eff(e) > 0.05).map(e => ({n: e.getAttribute('data-node'), r: e.getBoundingClientRect()}));
              const bub = svg.querySelector('[data-node="bubble"]');
              if (bub && eff(bub) > 0.05) {
                const box = bub.querySelector('[data-node="bubble-s"] > path:nth-child(3)');
                if (box) objs.push({n: 'bubble', r: box.getBoundingClientRect()});
              }
              for (const f of faces) {
                for (const o of objs) {
                  const qx = Math.max(o.r.left, Math.min(f.cx, o.r.right)), qy = Math.max(o.r.top, Math.min(f.cy, o.r.bottom));
                  if (Math.hypot(qx - f.cx, qy - f.cy) < f.rad - 0.5) out.push(`${pr.name} ${ratio} labels:${tv} u=${u.toFixed(2)}: ${o.n} over a face`);
                }
              }
            }
            x.destroy();
            el.remove();
          }
        }
      }
      return [...new Set(out)].slice(0, 30);
    }, [ID, presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});
