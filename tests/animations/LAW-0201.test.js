// LAW-0201 — Distribución de una sala · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion, anchoring of objects (each person stays on
// their seat, each label stays with its seat), and the transformation (people walking from the
// corridor through a door and sitting) recognisable with the labels hidden.
// Timing (u): rest 0–0.15 (nobody moves); walks are staggered inside 0.16–0.72 (their exact windows
// depend on the route lengths of each ratio); each seat label arrives body-first as its occupant lands;
// notes and the state tag fade in 0.75–0.82; everything is still from u ≈ 0.82.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0201';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const N = 6;
const PEOPLE = Array.from({length: N}, (_, i) => `p${i}`);

contractSuite(ID, {
  continuity: PEOPLE,
  // once everyone has landed, each person stays exactly on their seat
  attach: Array.from({length: 5}, (_, i) => ({from: 0.73, to: 1, a: `p${i}`, b: `seat${i}`, tol: 0.5})),
  semantic: [
    {at: 0, fn: "s.states.every(x => x === 'waiting') && s.labels.every(l => l === 0) && s.seated === 0 && s.startOutside", label: 'rest: everyone waits in the corridor, outside the room; no label shown'},
    {at: 0.145, fn: "s.states.every(x => x === 'waiting') && s.labels.every(l => l === 0)", label: 'nothing moves during the rest beat'},
    {at: 0.3, fn: "s.states.some(x => x !== 'waiting') && s.labels.every((l, i) => l === 0 || s.states[i] === 'seated')", label: 'the placement starts; a label only shows for a seated person'},
    ...[0.2, 0.25, 0.35, 0.45, 0.55, 0.65, 0.7].map(at => ({at, fn: "s.labels.every((l, i) => l === 0 || s.states[i] === 'seated')", label: `labels never arrive before their occupant lands (u=${at})`})),
    {at: 0.5, fn: "s.seated >= 1 && s.states.some(x => x === 'waiting' || x === 'walking' || x === 'sitting')", label: 'mid-way: some seated, others still on their way'},
    {at: 0.74, fn: "s.states.every(x => x === 'seated')", label: 'the main action is complete by u 0.74'},
    {at: 0.82, fn: 's.labels.every(l => l === 1)', label: 'every seat label is fully shown by u 0.82'},
    {at: 1, fn: "s.states.every(x => x === 'seated') && s.labels.every(l => l === 1) && s.finalState === 'all-seated' && s.allReached", label: 'hold: everyone seated (supplied final state), every label shown'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: "s.seated >= 1 && s.states.some(x => x !== 'seated')", label: 'labels hidden: the same walk and sit happens'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.states.every(x => x === 'seated')", label: 'labels hidden: everyone ends seated'},
    {at: 1, params: {finalState: 'last-waiting'}, fn: "s.states[s.states.length - 1] === 'waiting' && s.states.slice(0, -1).every(x => x === 'seated')", label: 'supplied state: the last person is still waiting at the door'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.states.some(x => x !== 'seated')", label: 'actionProgress freezes the placement part-way'},
    {at: 1, params: {routes: [{seat: 3, door: 'side'}, {seat: 0, door: 'main'}]}, fn: "s.order === 'right2>front' && s.states.length === 2", label: 'the supplied routes decide who walks where, in that order'},
    {at: 1, fn: 's.labelsPlaced', label: 'every label found a place beside its seat'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const seatsWithRoute = p.routes.map(r => p.seats[r.seat] && p.seats[r.seat].label).filter(Boolean); return [p.courts.building, p.courts.room, ...seatsWithRoute, p.labels.mainDoor, p.labels.sideDoor, p.labels.key, p.actorLabels.participant, p.objectLabels.route, p.objectLabels.seat, ...p.annotations.map(a => a.text)];",
  content: "const seatsWithRoute = p.routes.map(r => p.seats[r.seat] && p.seats[r.seat].label).filter(Boolean); return [p.courts.building, p.courts.room, ...seatsWithRoute];",
  captions: "return [p.labels.mainDoor, p.labels.sideDoor, p.actorLabels.participant, p.objectLabels.route, p.objectLabels.seat, p.locale === 'es' ? 'Todos sentados (según lo aportado)' : 'Everyone seated (as supplied)'];",
});

// ---------------------------------------------------------------------------------------------
// Rendered checks (every preset × ratio × labels shown/hidden). Distances in px at 1080p.
const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const HEADS = "const heads = [...svg.querySelectorAll('[data-node$=\"-head\"]')].filter(e => /^p\\d+-head$/.test(e.getAttribute('data-node'))).map(bx);";
// every visible card (seat labels, door captions, room name, notes, panel texts) is clear of every head
const NO_CARD_ON_FACE = `(() => { ${K} ${BOX} ${HEADS}
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^(lab\\d+-body|door-cap\\d+-body|room-name|state-tag|note\\d+|key|bld-name|legend-\\w+)$/.test(e.getAttribute('data-node')) && visible(e)).map(bx);
  return cards.every(c => heads.every(h => !hit(c, h, 1)));
})()`;
// each seat label: its chip lies within 40 px of its own person, the leader ends on that person, and the
// leader crosses no other text, chip or head
const LABEL_OWNS_SEAT = `(() => { ${K} ${BOX} ${HEADS}
  const labs = [...svg.querySelectorAll('[data-node^="lab"]')].filter(e => /^lab\\d+$/.test(e.getAttribute('data-node')) && visible(e));
  if (!labs.length) return false;
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
  for (const lab of labs) {
    const i = lab.getAttribute('data-node').slice(3);
    const body = bx(svg.querySelector('[data-node="lab' + i + '-body"]'));
    const person = svg.querySelector('[data-node="' + lab.getAttribute('data-owner') + '"]');
    const pb = bx(person);
    const gap = Math.max(0, Math.max(pb.l - body.r, body.l - pb.r), Math.max(pb.t - body.b, body.t - pb.b)) / K;
    if (gap > 40) return false;
    const line = svg.querySelector('[data-node="lab' + i + '-lead"]');
    const m = line.getScreenCTM();
    const A = new DOMPoint(+line.getAttribute('x1'), +line.getAttribute('y1')).matrixTransform(m), B = new DOMPoint(+line.getAttribute('x2'), +line.getAttribute('y2')).matrixTransform(m);
    if (!(B.x >= pb.l - 2 && B.x <= pb.r + 2 && B.y >= pb.t - 2 && B.y <= pb.b + 2)) return false;
    const pts = Array.from({length: 12}, (_, j) => ({x: A.x + (B.x - A.x) * (0.1 + 0.8 * j / 11), y: A.y + (B.y - A.y) * (0.1 + 0.8 * j / 11)}));
    const others = [...texts.filter(t => !lab.contains(t)).map(bx), ...labs.filter(o => o !== lab).map(o => bx(svg.querySelector('[data-node="' + o.getAttribute('data-node') + '-body"]'))), ...heads];
    if (pts.some(q => others.some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b))) return false;
  }
  return true;
})()`;
// owner proximity: each seat chip is nearer its own occupant (or own chair) than any other person or chair,
// empty or taken, so no chip reads as belonging to a neighbouring seat
const NEAREST_IS_OWNER = `(() => { ${K} ${BOX}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^lab\\d+$/.test(e.getAttribute('data-node')) && visible(e));
  if (!labs.length) return false;
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
// people and their heads are large enough to read (px at 1080p)
const PEOPLE_SIZE = `(() => { ${K}
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); return hd.width / K >= 26 && e.getBoundingClientRect().width / K >= 60; });
})()`;
// the scene (plan + building) fills the caption-safe box (>= 90 % on its long axis, >= 72 % on the other)
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
// people never fade: whoever is drawn is whole and opaque at every time
const OPAQUE = "[...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node'))).every(e => visible(e) && !e.getAttribute('opacity'))";

ratioChecks(ID, 'cards off faces, labels own their seats, people large, plan fills the frame', [
  {at: times(0, 1, 0.05), dom: NO_CARD_ON_FACE, label: 'rendered: no card, chip or note covers a head'},
  {at: [0.82, 1], tv: ['all'], dom: LABEL_OWNS_SEAT, label: 'rendered: each label within 40 px of its own person, its leader ends on that person and crosses no text, chip or head'},
  {at: [0.82, 1], tv: ['all'], dom: NEAREST_IS_OWNER, label: 'rendered: each seat chip is nearer its own occupant than any other person or chair (empty or taken)'},
  {at: [0, 1], dom: PEOPLE_SIZE, label: 'rendered: people >= 60 px across and heads >= 26 px (1080p)'},
  {at: [1], dom: FILL, label: 'rendered: the plan and the building fill the caption-safe box (labels shown and hidden)'},
  {at: times(0, 1, 0.1), dom: OPAQUE, label: 'rendered: people are always whole and opaque (nobody fades in)'},
  {at: [0], fn: 's.startOutside', label: 'everyone starts outside the room, in the corridor'},
  {at: [1], tv: ['all'], fn: 's.labelsPlaced', label: 'every label placed beside its seat (no fallback)'},
  {at: [0.3, 0.5, 0.65], fn: "s.labels.every((l, i) => l === 0 || s.states[i] === 'seated')", label: 'labels never arrive before their occupant lands'},
]);

// Doors only open for someone on the move; a person enters only through a door (rendered at 60 fps in 16:9):
// a person inside the room at frame n+1 who was outside at frame n crossed the wall at a door gap.
test(`${ID}: people enter the room only through a door gap (every preset, 16:9, 60 fps)`, async ({page}) => {
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
        if (prev) s.inRoom.forEach((v, i) => { if (v && !prev.inRoom[i] && !s.atDoor[i]) out.push(`${pr.name} f${f} p${i}`); });
        prev = s;
      }
      x.destroy(); el.remove();
    }
    return out;
  }, [ID, presets]);
  expect(bad).toEqual([]);
});
