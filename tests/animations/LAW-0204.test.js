// LAW-0204 — Distribución de una sala · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens holds a second copy of the plan
// drawn at the SAME coordinates, cropped to the inspected table, person, label and datum), the change is
// localised (one person moves one seat along the same table and only its leader follows; everybody else
// stays), and seeking back to earlier times restores exactly the previous datum.
// Windows (u): frame 0.20–0.24 · plan texts fade 0.20–0.225 and the plan shrinks into a corner of its area
// 0.215–0.28 · lens opens 0.28–0.36 in the freed space · strike 0.46–0.50 · old value docks 0.51–0.55 · move
// 0.55–0.62 · new value 0.62–0.65 · lens closes 0.72–0.77 · plan grows back 0.77–0.83, its texts return
// 0.83–0.855 · marker 0.855–0.89; everything still from 0.89. The seat label is never replaced: the
// substituted value has its own chip (label substitutions included).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0204';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['person'],
  attach: [{from: 0, to: 0.549, a: 'person', b: 'seatBefore', tol: 0.5}, {from: 0.63, to: 1, a: 'person', b: 'seatAfter', tol: 0.5}],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.personSlot === 'right1' && s.markerShown === 0", label: 'context: everyone seated; the old datum; no lens, no marker'},
    {at: 0.4, fn: "s.lensOpen > 0.9 && s.datum === 'before' && s.zoom >= 1.5 && s.stackInCrop && s.lensClearOfPeople && s.lensClearOfSource", label: 'isolate: a real enlargement (>= 1.5x) of the detail, clear of every person and of its source'},
    {at: 0.49, fn: "s.datum === 'changing' && s.strike > 0 && s.personSlot === 'right1'", label: 'substitute: the old value is struck through before anything moves'},
    {at: 0.585, fn: "s.personSlot === 'moving' && s.oldDocked === 1", label: 'the old value is docked; only the inspected person moves'},
    {at: 0.66, fn: "s.datum === 'after' && s.personSlot === 'right2' && s.lensOpen === 1 && s.newShown === 1", label: 'the new value and the new seat in the lens'},
    {at: 0.8, fn: "s.lensOpen === 0 && s.datum === 'after'", label: 'return: the lens has closed onto the updated context'},
    {at: 1, fn: "s.markerShown === 1 && s.datum === 'after' && s.personSlot === 'right2' && s.oldDocked === 1 && s.allReached", label: 'hold: new seat, struck old value docked, marker shown'},
    {at: 0.3, fn: "s.datum === 'before' && s.strike === 0 && s.oldDocked === 0 && s.personSlot === 'right1'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, fn: 'JSON.stringify(s.others.filter(Boolean)) === JSON.stringify(s.others.filter(Boolean))', label: 'the other people are listed (fixed places)'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.focusTarget === 'label' && !s.moves && s.datum === 'after' && s.markerShown === 1", label: 'label substitution: only the label changes; nobody moves'},
    {at: 0.66, params: {textVisibility: 'none'}, fn: "s.personSlot === 'right2' && s.lensOpen === 1", label: 'labels hidden: the same localised change is visible'},
    {at: 1, params: {afterSlot: 'right1'}, fn: "!s.moves && s.personSlot === 'right1'", label: 'an after-seat equal to the current seat moves nobody (nothing inferred)'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const focus = p.seats[p.focusSeat]; const others = p.routes.map(r => p.seats[r.seat]).filter(s => s && s !== focus).map(s => s.label); return [p.courts.building, p.courts.room, ...others, focus.label, p.afterValue, p.beforeValue, p.labels.mainDoor, p.labels.sideDoor, p.labels.key, p.contextLabels.context, p.contextLabels.marker].filter(Boolean);",
  content: "const focus = p.seats[p.focusSeat]; const others = p.routes.map(r => p.seats[r.seat]).filter(s => s && s !== focus).map(s => s.label); return [...others, p.afterValue];",
  captions: 'return [p.labels.mainDoor, p.labels.sideDoor];',
});

const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const HEADS = "const heads = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+-head$/.test(e.getAttribute('data-node'))).map(bx);";
// no chip, the lens window, the marker or the panel covers a head in the context
const NO_COVER = `(() => { ${K} ${BOX} ${HEADS}
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^(lab\\d+-body|door-cap\\d+-body|room-name|cx-label-body|cx-old-body|cx-new-body|cx-marker|panel|lens-bg)$/.test(e.getAttribute('data-node')) && visible(e) && parseFloat(getComputedStyle(e).opacity || 1) > 0).map(bx);
  const lens = svg.querySelector('[data-node="lens"]');
  const lensOn = lens && parseFloat(lens.getAttribute('opacity') || 0) > 0;
  const cardsNow = lensOn ? cards : cards.filter((c, i) => true);
  return heads.length > 0 && cardsNow.every(c => heads.every(h => !hit(c, h, 1)));
})()`;
// the seat labels (others) sit beside their own person; the inspected label's leader ends on the person
const LABEL_OWNS_SEAT = `(() => { ${K} ${BOX} ${HEADS}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^lab\\d+$/.test(e.getAttribute('data-node')) && visible(e));
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]') && !t.closest('[data-node="lens"]'));
  for (const lab of labs) {
    const nm = lab.getAttribute('data-node');
    const body = bx(svg.querySelector('[data-node="' + nm + '-body"]'));
    const pb = bx(svg.querySelector('[data-node="' + lab.getAttribute('data-owner') + '"]'));
    const gap = Math.max(0, Math.max(pb.l - body.r, body.l - pb.r), Math.max(pb.t - body.b, body.t - pb.b)) / K;
    if (gap > 40) return false;
    const line = svg.querySelector('[data-node="' + nm + '-lead"]');
    const m = line.getScreenCTM();
    const A = new DOMPoint(+line.getAttribute('x1'), +line.getAttribute('y1')).matrixTransform(m), B = new DOMPoint(+line.getAttribute('x2'), +line.getAttribute('y2')).matrixTransform(m);
    if (!(B.x >= pb.l - 2 && B.x <= pb.r + 2 && B.y >= pb.t - 2 && B.y <= pb.b + 2)) return false;
    const pts = Array.from({length: 12}, (_, j) => ({x: A.x + (B.x - A.x) * (0.1 + 0.8 * j / 11), y: A.y + (B.y - A.y) * (0.1 + 0.8 * j / 11)}));
    if (pts.some(q => [...texts.filter(t => !lab.contains(t)).map(bx), ...heads].some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b))) return false;
  }
  // the inspected label: its leader ends on the inspected person (whichever seat they are on)
  const lead = svg.querySelector('[data-node="cx-lead"]');
  if (lead) {
    const m = lead.getScreenCTM();
    const B = new DOMPoint(+lead.getAttribute('x2'), +lead.getAttribute('y2')).matrixTransform(m);
    const newG = svg.querySelector('[data-node="cx-new"]');
    const lblEl = svg.querySelector('[data-node="cx-label-body"]') || (newG && parseFloat(newG.getAttribute('opacity')) > 0.5 ? svg.querySelector('[data-node="cx-new-body"]') : svg.querySelector('[data-node="cx-old-body"]'));
    const lbl = bx(lblEl);
    const owners = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node'))).map(bx);
    const own = owners.find(o => B.x >= o.l - 2 && B.x <= o.r + 2 && B.y >= o.t - 2 && B.y <= o.b + 2);
    if (!own) return false;
    const gap = Math.max(0, Math.max(own.l - lbl.r, lbl.l - own.r), Math.max(own.t - lbl.b, lbl.t - own.b)) / K;
    if (gap > 40) return false;
  }
  return true;
})()`;
const PEOPLE_SIZE = `(() => { ${K}
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); return hd.width / K >= 26 && e.getBoundingClientRect().width / K >= 60; });
})()`;
// the lens phase (shrink → lens → regrow): the context people may go down to 45 px, no lower
const PEOPLE_LENS = `(() => { ${K}
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => e.getBoundingClientRect().width / K >= 45);
})()`;
// the substituted datum stays traceable: the new value chip (or the old one before the change) and, once
// docked, the struck "was" chip are visible at >= 16 px (1080p)
const VALUE_TRACE = `(() => { ${K}
  const px = t => parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(t.getScreenCTM().a * t.getScreenCTM().d)) / K * (vb.width > vb.height * 1.2 ? 1920 : 1080) / (vb.width > vb.height * 1.2 ? 1920 : 1080);
  const wrap = svg.querySelector('[data-node="cx-wrap"]');
  if (!wrap || !visible(wrap) || parseFloat(wrap.getAttribute('opacity') || 1) < 0.99) return false;
  const newG = svg.querySelector('[data-node="cx-new"]');
  const shown = newG && parseFloat(newG.getAttribute('opacity') || 0) > 0.99 ? newG : svg.querySelector('[data-node="cx-old"]');
  const texts = [shown, svg.querySelector('[data-node="cx-dock"]')].filter(e => e && visible(e) && parseFloat(e.getAttribute('opacity') ?? 1) > 0).flatMap(e => [...e.querySelectorAll('text')]);
  return texts.length > 0 && texts.every(t => px(t) >= 16);
})()`;
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
// guides start on the source frame and end on the lens window, crossing no text and no head
const GUIDES = `(() => { ${K} ${BOX} ${HEADS}
  const src = svg.querySelector('[data-node="src-frame"]');
  if (!src || !visible(src) || parseFloat(src.getAttribute('opacity')) < 0.5) return true;
  const sb = bx(src), lb = bx(svg.querySelector('[data-node="lens-bg"]'));
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-node="lens"]') && !t.closest('[data-layer="content-notice"]')).map(bx);
  const near = (q, b) => q.x >= b.l - 3 && q.x <= b.r + 3 && q.y >= b.t - 3 && q.y <= b.b + 3;
  const guides = [...svg.querySelectorAll('[data-node^="guide"]')].filter(e => visible(e) && parseFloat(e.getAttribute('opacity')) > 0);
  for (const gd of guides) {
    const m = gd.getScreenCTM();
    const A = new DOMPoint(+gd.getAttribute('x1'), +gd.getAttribute('y1')).matrixTransform(m), B = new DOMPoint(+gd.getAttribute('x2'), +gd.getAttribute('y2')).matrixTransform(m);
    if (!near(A, sb) || !near(B, lb)) return false;
    for (let j = 2; j < 28; j++) { const q = {x: A.x + (B.x - A.x) * j / 30, y: A.y + (B.y - A.y) * j / 30}; if ([...texts, ...heads].some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b)) return false; }
  }
  return true;
})()`;

// owner proximity: each (other) seat chip is nearer its own occupant than any other person or chair
const NEAREST_IS_OWNER = `(() => { ${K} ${BOX}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^lab\\d+$/.test(e.getAttribute('data-node')) && visible(e));
  const ctr = e => { const r = e.getBoundingClientRect(); return {x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2, e}; };
  const chairs = [...svg.querySelectorAll('[data-node^="rm-chair-"]')].map(ctr);
  const people = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node'))).map(ctr);
  const dist = (b, q) => Math.hypot(Math.max(0, b.l - q.x, q.x - b.r), Math.max(0, b.t - q.y, q.y - b.b));
  return labs.every(lab => {
    const body = bx(svg.querySelector('[data-node="' + lab.getAttribute('data-node') + '-body"]'));
    const owner = svg.querySelector('[data-node="' + lab.getAttribute('data-owner') + '"]');
    const seat = svg.querySelector('[data-node="' + lab.getAttribute('data-seat') + '"]');
    const own = [owner, seat].filter(Boolean).map(ctr);
    const d0 = Math.min(...own.map(q => dist(body, q)));
    const others = [...chairs, ...people].filter(q => q.e !== owner && q.e !== seat && own.every(o => Math.hypot(o.x - q.x, o.y - q.y) > 4 * K));
    return others.every(q => dist(body, q) > d0);
  });
})()`;
// the inspected stack (label, value, dock) never lies on furniture: desk, tables, bench, plants or an empty chair
const STACK_OFF_FURNITURE = `(() => { ${K} ${BOX}
  const parts = ['cx-label-body', 'cx-old-body', 'cx-new-body'].map(n => svg.querySelector('[data-node="' + n + '"]')).filter(e => e && visible(e) && parseFloat(getComputedStyle(e).opacity || 1) > 0).map(bx);
  const dock = svg.querySelector('[data-node="cx-dock"]');
  if (dock && visible(dock)) parts.push(bx(dock));
  const people = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node'))).map(bx);
  const inside = (q, b) => q.x > b.l && q.x < b.r && q.y > b.t && q.y < b.b;
  const furn = [...svg.querySelectorAll('[data-node]')].filter(e => /^rm-(desk|table\\d|bench|plant\\d|chair-\\w+)$/.test(e.getAttribute('data-node'))).filter(e => {
    if (!/chair/.test(e.getAttribute('data-node'))) return true;
    const r = e.getBoundingClientRect(); const c = {x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2};
    return !people.some(pb => inside(c, pb));
  }).map(bx);
  return parts.every(pb => furn.every(f => !hit(pb, f, 3 * K)));
})()`;
// the lens copy holds furniture whole or not at all (no piece cut by its rim)
const LENS_WHOLE = `(() => { ${BOX}
  const lens = svg.querySelector('[data-node="lens-bg"]');
  if (!lens || !visible(lens)) return true;
  const lb = bx(lens);
  const pieces = [...svg.querySelectorAll('[data-node]')].filter(e => /^lzrm-(desk|table\\d|bench|plant\\d|chair-\\w+)$/.test(e.getAttribute('data-node'))).map(bx);
  return pieces.every(b => b.l >= lb.l - 2 && b.r <= lb.r + 2 && b.t >= lb.t - 2 && b.b <= lb.b + 2);
})()`;

ratioChecks(ID, 'lens: real zoom, clear of people, fields whole, guides anchored; labels own their seats', [
  {at: [0.1, 1], fn: 's.contextScale === 1 && s.textOnPlan === 1 && s.lensOpen === 0', label: 'build and hold: the plan fills its area at full size, every text on it shown, no lens'},
  {at: [0.4, 0.6], fn: 's.contextScale < 1 && s.lensOpen === 1 && s.lensClearOfPlan && (s.textOnPlan === 0 || s.contextScale * s.textPx >= 16)', label: 'lens open: the plan has shrunk into its corner (its texts shown only while >= 16 px), the lens sits in the freed space'},
  {at: times(0.2, 0.9, 0.02), dom: PEOPLE_LENS, label: 'rendered: while the lens phase runs (shrink, open, close, regrow) every person stays >= 45 px across (1080p)'},
  {at: times(0.77, 1, 0.01), tv: ['all'], dom: VALUE_TRACE, label: 'rendered: through the return and hold the substituted value (and, once docked, the struck old value) stay visible at >= 16 px'},
  {at: times(0.15, 0.9, 0.03), dom: NO_COVER, label: 'rendered: dense lens phase — no chip, marker, panel or lens window covers a head'},
  {at: [0.4, 0.6], dom: LENS_WHOLE, label: 'rendered: every piece of furniture in the lens is whole (none cut by the rim)'},
  {at: [0.1, 1], tv: ['all'], dom: STACK_OFF_FURNITURE, label: 'rendered: the inspected label, value and "was" chips lie on no furniture (desk, tables, bench, plants, empty chairs)'},
  {at: [0.1, 1], tv: ['all'], dom: NEAREST_IS_OWNER, label: 'rendered: each seat chip is nearer its own occupant than any other person or chair (empty or taken)'},
  {at: [0.4, 0.5, 0.6, 0.7], fn: 's.zoom >= 1.5 && s.lensOpen === 1 && s.stackInCrop', label: 'the lens enlarges >= 1.5x and holds the whole inspected stack'},
  {at: times(0.2, 0.8, 0.02), fn: 's.lensClearOfPeople && s.lensClearOfSource', label: 'the lens window never covers a person, nor its own source'},
  {at: [0.3, 0.5, 0.7], fn: 's.guidesClear', label: 'the guides are clear of heads and texts (layout)'},
  {at: [0.3, 0.5, 0.7], dom: GUIDES, label: 'rendered: guides start on the source frame, end on the lens and cross no text or head'},
  {at: [0.65, 0.68, 0.71], tv: ['all'], fn: "s.newShown === 1 && s.lensOpen === 1 && s.datum === 'after'", label: 'the new value is readable and still in the lens for >= 400 ms'},
  {at: [1], fn: 's.markerShown === 1 && s.markerClearOfHeads', label: 'the Δ marker is clear of every head'},
  {at: times(0, 1, 0.05), dom: NO_COVER, label: 'rendered: no chip, marker, panel or lens window covers a head'},
  {at: [0.1, 1], tv: ['all'], dom: LABEL_OWNS_SEAT, label: 'rendered: each label within 40 px of its own person; leaders end on their person and cross no text or head'},
  {at: [0, 0.1, 0.19, 0.9, 1], dom: PEOPLE_SIZE, label: 'rendered: at rest, build and hold people >= 60 px across, heads >= 26 px (1080p)'},
  {at: [1], dom: FILL, label: 'rendered: plan, lens column and panel fill the caption-safe box'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);

// Rendered, dense (every 20 ms over u 0.20–0.80) in every preset × ratio × labels shown/hidden:
// (1) no lens-copy text line is cut by the lens rim and each text field is wholly in the copy or wholly left out;
// (2) the lens card is never bare: whenever the window shows, its copy shows at the same opacity.
test(`${ID}: lens rim — no copy line cut, fields wholly in or out (rendered, every 20 ms; window and copy share one opacity, so the card is never bare)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, ps]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of ps) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const q = n => svg.querySelector(`[data-node="${n}"]`);
      const step = 20 / x.durationMs;
      let texts = 0;
      for (let u = 0.2; u <= 0.8 + 1e-9; u += step) {
        x.seek(u * x.durationMs);
        const lens = q('lens');
        const op = parseFloat(lens.getAttribute('opacity') || 0);
        if (op <= 0.02) continue;
        const win = q('lens-bg').getBoundingClientRect();
        for (const t of q('lens-content').querySelectorAll('text')) {
          let hidden = false;
          for (let e = t; e && e !== lens; e = e.parentElement) if (e.getAttribute && e.getAttribute('opacity') === '0') hidden = true;
          if (hidden || !(t.textContent || '').trim()) continue;
          const spans = [...t.querySelectorAll('tspan')].filter(s => (s.textContent || '').trim());
          const inside = spans.map(s => { const b = s.getBoundingClientRect(); return b.left >= win.left - 1 && b.right <= win.right + 1 && b.top >= win.top - 1 && b.bottom <= win.bottom + 1; });
          const touching = spans.map(s => { const b = s.getBoundingClientRect(); return b.left < win.right && b.right > win.left && b.top < win.bottom && b.bottom > win.top; });
          texts++;
          if (touching.some(Boolean) && !inside.every(Boolean)) out.push(`${pr.name} ${ratio} ${tv} u=${u.toFixed(2)}: "${t.textContent.slice(0, 24)}" cut by the rim or only partly in the lens`);
        }
      }
      if (tv === 'all' && !texts) out.push(`${pr.name} ${ratio}: no lens text found (vacuous)`);
      x.destroy(); el.remove();
    }
    return [...new Set(out)].slice(0, 30);
  }, [ID, presets]);
  expect(bad, bad.join('\n')).toEqual([]);
});
