// LAW-0209 — Asignación de órgano · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (the clerk and the file never jump), anchoring of the
// objects (the file stays in the clerk's hands until it is set down, then stays in the in-tray / the slot),
// and the transformation (a file carried from the intake office along a drawn route to one of several
// venues) recognisable with the labels hidden. Legal content: the venue is decided ONLY by the supplied
// mapping (the row whose datum equals the file's datum); without a match the file waits in the slot.
// Timing (u): rest 0–0.15 · road route 0.15–0.20 · walk to the sorting point 0.16–0.36 · datum callout
// 0.36–0.385 · scan of the venue tags 0.385–0.45 (match at 0.45) · second route 0.45–0.51 · walk to the venue
// 0.49–0.67 (to the waiting slot 0.49–0.60) · set down 0.67–0.71 (0.60–0.64) · notes and state 0.75–0.81;
// everything is still from u 0.81.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0209';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['clerk', 'file'],
  attach: [{from: 0, to: 0.66, a: 'file', b: 'hands', tol: 0.5}, {from: 0.72, to: 1, a: 'file', b: 'target', tol: 0.5}],
  semantic: [
    {at: 0, fn: "s.phase === 'intake' && s.inIntake && s.route1 === 0 && s.route2 === 0 && s.matched === 0 && s.carry === 1", label: 'rest: the clerk holds the file in the intake office; no route, no match'},
    {at: 0.145, fn: "s.phase === 'intake' && s.route1 === 0", label: 'nothing moves during the rest beat'},
    {at: 0.3, fn: "s.phase === 'walking' && s.route1 === 1 && s.carry === 1 && !s.inIntake", label: 'the route is drawn ahead of the walk; the clerk carries the file along the road'},
    {at: 0.41, fn: "s.phase === 'reading' && s.scanRow >= 0 && s.matched === 0 && s.readShown === 1", label: 'at the sorting point the datum is read and the venue tags are compared in turn'},
    {at: 0.46, fn: 's.matched === 1 && s.selected === 1 && s.matchRow === 1', label: 'the tag whose datum equals the file datum (supplied mapping) is matched'},
    {at: 0.6, fn: "s.phase === 'to-destination' && s.route2 === 1 && s.carry === 1", label: 'the clerk follows the drawn route to that venue, file in hand'},
    {at: 0.74, fn: "s.phase === 'set-down' && s.fileInTray && s.inVenue[1] && s.carry === 0", label: 'the main action is complete by u 0.74: the file is in the in-tray of the matched venue'},
    {at: 1, fn: "s.fileInTray && s.inVenue[1] && s.matched === 1 && s.finalState === 'set-down' && s.allReached && s.problems.length === 0", label: 'hold: the supplied final state; the composition fits'},
    {at: 0.3, fn: "s.matched === 0 && s.route2 === 0", label: 'seeking back: no match and no second route before the sorting point'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.fileInTray && s.inVenue[1]', label: 'labels hidden: the same carrying and setting down happens'},
    {at: 1, params: {file: {label: 'Case file 24-017 (fictional)', datum: 'district = South (fictional)'}}, fn: 's.selected === 2 && s.inVenue[2] && s.fileInTray', label: 'another supplied datum sends the file to the venue of its row'},
    {at: 1, params: {routes: [{datum: 'district = East (fictional)', venue: 0}, {datum: 'district = North (fictional)', venue: 1}]}, fn: 's.selected === 0 && s.inVenue[0]', label: 'the route follows ONLY the supplied mapping (not the venue names)'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.selected === -1 && s.matchRow === -1 && s.fileInSlot && s.inVenue.every(v => !v)", label: 'no matching row: the venue stays pending and the file waits in the dashed slot (no consequence)'},
    {at: 1, params: {finalState: 'held-at-junction'}, fn: "s.phase === 'junction' && s.carry === 1 && s.route2 === 0", label: 'supplied final state: the clerk keeps the file at the sorting point'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.phase !== 'set-down'", label: 'actionProgress freezes the sending part-way'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.courts.origin, ...p.courts.venues.map(v => v.name), ...p.routes.filter(r => r.venue < p.courts.venues.length).map(r => r.datum), p.file.label, p.file.datum, p.seats.arrival, p.seats.waiting, p.labels.junction, p.labels.key, p.actorLabels.clerk, p.objectLabels.route, p.objectLabels.tag, ...p.annotations.map(a => a.text)];",
  content: "return [p.courts.origin, ...p.courts.venues.map(v => v.name), ...p.routes.filter(r => r.venue < p.courts.venues.length).map(r => r.datum), p.file.label, p.file.datum];",
  captions: "return [p.labels.junction, p.actorLabels.clerk, p.objectLabels.route, p.objectLabels.tag, p.seats.arrival, p.seats.waiting];",
});

// ---------------------------------------------------------------------------------------------
// Rendered checks (every preset × ratio × labels shown/hidden). Distances in px at 1080p.
const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
// no card, chip, callout or panel text covers the clerk's head
const NO_CARD_ON_FACE = `(() => { ${K} ${BOX}
  const head = bx(svg.querySelector('[data-node="clerk-head"]'));
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^(vb\\d+|origin-name|junction-cap|read-card|state-tag|file-card|key|legend-\\w+|note\\d+)$/.test(e.getAttribute('data-node')) && visible(e) && parseFloat(e.getAttribute('opacity') ?? 1) > 0.02).map(bx);
  return cards.every(c => !hit(c, head, 1));
})()`;
// the clerk is large enough to read (px at 1080p): body >= 60 px across, head >= 26 px
const PEOPLE_SIZE = `(() => { ${K}
  const e = svg.querySelector('[data-node="clerk"]'); const hd = svg.querySelector('[data-node="clerk-head"]').getBoundingClientRect();
  const b = e.getBoundingClientRect();
  return Math.min(b.width, b.height) / K >= 60 && hd.width / K >= 26;
})()`;
// the scene fills the caption-safe box (>= 90 % on its long axis, >= 72 % on the other)
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
// the plan itself (not only the texts) takes a large share of the caption-safe box
const PLAN_LARGE = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-node=\"s-sheet\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; return ((p2.x - p1.x) * (p2.y - p1.y)) / (vb.width * 0.88 * vb.height * 0.74) >= 0.3; })()";
// the clerk is always whole and opaque
const OPAQUE = "visible(svg.querySelector('[data-node=\"clerk\"]')) && !svg.querySelector('[data-node=\"clerk\"]').getAttribute('opacity') && visible(svg.querySelector('[data-node=\"file\"]'))";
// venue blocks: each block's leader ends on its own venue's wall
const BLOCK_LEADS = `(() => { ${BOX}
  const blocks = [...svg.querySelectorAll('[data-node]')].filter(e => /^vb\\d+$/.test(e.getAttribute('data-node')));
  return blocks.every(b => { const i = b.getAttribute('data-node').slice(2); const v = bx(svg.querySelector('[data-node="s-venue' + i + '"]')); const lead = b.parentNode.querySelector('circle'); const c = lead.getBoundingClientRect(); const x = (c.left + c.right) / 2, y = (c.top + c.bottom) / 2; return x >= v.l - 14 && x <= v.r + 14 && y >= v.t - 14 && y <= v.b + 14; });
})()`;

ratioChecks(ID, 'clerk large and uncovered, plan fills the frame, blocks tied to their venues', [
  {at: times(0, 1, 0.05), dom: NO_CARD_ON_FACE, label: 'rendered: no card, chip, callout or panel covers the clerk\'s head'},
  {at: times(0, 1, 0.1), dom: PEOPLE_SIZE, label: 'rendered: the clerk >= 60 px across and head >= 26 px (1080p) at rest, build and hold'},
  {at: [1], dom: FILL, label: 'rendered: the scene fills the caption-safe box (labels shown and hidden)'},
  {at: [1], dom: PLAN_LARGE, label: 'rendered: the plan itself covers >= 30 % of the caption-safe box'},
  {at: times(0, 1, 0.1), dom: OPAQUE, label: 'rendered: the clerk and the file are always drawn whole'},
  {at: [0, 1], tv: ['all'], dom: BLOCK_LEADS, label: 'rendered: each venue block\'s leader ends on its own venue'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
  {at: [0.46, 1], fn: 's.selected === -1 ? s.matchRow === -1 : s.matched === 1', label: 'the match (or no match) follows the supplied mapping'},
]);

// The clerk enters a venue only through its door, and leaves the intake office only through its door
// (every preset, 16:9, 60 fps).
test(`${ID}: the clerk crosses walls only at doors (every preset, 16:9, 60 fps)`, async ({page}) => {
  test.setTimeout(120000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, ps]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of ps) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: 1920, height: 1080, params: pr.params});
      await x.ready;
      const frames = Math.ceil(x.durationMs / 1000 * 60);
      let prev = null;
      for (let f = 0; f <= frames; f++) {
        x.renderFrame(f, {fps: 60});
        const s = x.getState({bounds: false}).semantic;
        if (prev) {
          s.inVenue.forEach((v, i) => { if (v && !prev.inVenue[i] && !s.atVenueDoor[i]) out.push(`${pr.name} f${f} venue${i}`); });
          if (!s.inIntake && prev.inIntake && s.phase !== 'walking') out.push(`${pr.name} f${f} left the office outside a walk`);
        }
        prev = s;
      }
      x.destroy(); el.remove();
    }
    return out;
  }, [ID, presets]);
  expect(bad).toEqual([]);
});

// Visible text is never below 16 px at 1080p at any sampled time (not only at the hold).
test(`${ID}: every visible text >= 16 px at every sampled u (all presets × ratios)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) {
      for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        const svg = x.element;
        const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
        for (let u = 0; u <= 1.0001; u += 0.02) {
          x.seek(u * x.durationMs);
          const s0 = svg.getScreenCTM().a;
          for (const t of svg.querySelectorAll('text')) {
            if (t.closest('[data-layer="content-notice"]') || eff(t) < 0.05 || !(t.textContent || '').trim()) continue;
            const b = t.getBoundingClientRect();
            if (b.width < 0.5) continue;
            const fs = parseFloat(getComputedStyle(t).fontSize);
            const pxs = fs * (t.getScreenCTM().a / s0) * 1080 / Math.min(w, h);
            if (pxs < 16 - 0.05) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: "${t.textContent.slice(0, 20)}" ${pxs.toFixed(1)} px`);
          }
        }
        x.destroy();
        el.remove();
      }
    }
    return [...new Set(out)].slice(0, 40);
  }, [ID, presets]);
  expect(bad, bad.join('\n')).toEqual([]);
});
