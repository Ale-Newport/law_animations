// LAW-0217 — Acceso a sala · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion (people walk whole from their corridor through their own door
// to their seat — no teleport), anchoring of objects (each person stays on their seat, each label stays with its
// seat) and the transformation (entering by separate routes and sitting) recognisable with the labels hidden.
// Timing (u): rest 0–0.15 (nobody moves); walks are staggered inside 0.16–0.72 (their windows depend on the route
// lengths of each ratio); each seat label arrives body-first as its occupant lands; notes and the state tag fade in
// 0.75–0.82; everything is still from u ≈ 0.82.
// Legal: both routes have equal visual weight (same badge size, same solid route-line width, same door leaf); no
// dashes, no directed links; the key says "as supplied · no conclusion drawn".
// Coordinator decision (standing stress rule, 2026-09-26, AUTHORING item 20): the long-labels-stress count is capped to
// the baseline's four people (texts stay near-maximum) so every chip keeps off every route line — measurements in the presets file.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0217';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const PEOPLE = Array.from({length: 6}, (_, i) => `p${i}`);

contractSuite(ID, {
  continuity: PEOPLE,
  attach: Array.from({length: 4}, (_, i) => ({from: 0.73, to: 1, a: `p${i}`, b: `seat${i}`, tol: 0.5})),
  semantic: [
    {at: 0, fn: "s.states.every(x => x === 'waiting') && s.labels.every(l => l === 0) && s.seated === 0 && s.startOutside", label: 'rest: everyone waits in a corridor, outside the room; no label shown'},
    {at: 0.145, fn: "s.states.every(x => x === 'waiting') && s.labels.every(l => l === 0)", label: 'nothing moves during the rest beat'},
    {at: 0.3, fn: "s.states.some(x => x !== 'waiting') && s.labels.every((l, i) => l === 0 || s.states[i] === 'seated')", label: 'the entrance starts; a label only shows for a seated person'},
    ...[0.2, 0.25, 0.35, 0.45, 0.55, 0.65, 0.7].map(at => ({at, fn: "s.labels.every((l, i) => l === 0 || s.states[i] === 'seated')", label: `labels never arrive before their occupant lands (u=${at})`})),
    {at: 0.5, fn: "s.seated >= 1 && s.states.some(x => x === 'waiting' || x === 'walking' || x === 'sitting')", label: 'mid-way: some seated, others still on their way'},
    {at: 0.74, fn: "s.states.every(x => x === 'seated')", label: 'the main action is complete by u 0.74'},
    {at: 0.82, fn: 's.labels.every(l => l === 1)', label: 'every seat label is fully shown by u 0.82'},
    {at: 1, fn: "s.states.every(x => x === 'seated') && s.labels.every(l => l === 1) && s.finalState === 'all-seated' && s.allReached", label: 'hold: everyone seated (supplied final state), every label shown'},
    {at: 1, fn: "s.routesThroughOwnDoor && JSON.stringify(s.access) === JSON.stringify(['restricted', 'public', 'public', 'restricted'])", label: 'each person walks through the door of their supplied route, and only that door'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: "s.seated >= 1 && s.states.some(x => x !== 'seated')", label: 'labels hidden: the same entrance and sitting happens'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.states.every(x => x === 'seated')", label: 'labels hidden: everyone ends seated'},
    {at: 1, params: {finalState: 'last-waiting'}, fn: "s.states[s.states.length - 1] === 'waiting' && s.states.slice(0, -1).every(x => x === 'seated')", label: 'supplied state: the last person is still waiting in the corridor'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.states.some(x => x !== 'seated')", label: 'actionProgress freezes the entrance part-way'},
    {at: 1, params: {routes: [{seat: 3, access: 'public'}, {seat: 0, access: 'public'}]}, fn: "s.order === 'back4:public>front1:public' && s.states.length === 2", label: 'the supplied routes decide who walks where, by which route, in that order'},
    {at: 1, fn: 's.labelsPlaced', label: 'every label found a place beside its seat'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const seats = p.routes.map(r => p.seats[r.seat] && p.seats[r.seat].label).filter(Boolean); return [p.courts.building, p.courts.room, ...seats, p.labels.publicAccess, p.labels.restrictedAccess, p.labels.key, p.actorLabels.participant, p.objectLabels.route, p.objectLabels.door, ...p.annotations.map(a => a.text)];",
  content: "const seats = p.routes.map(r => p.seats[r.seat] && p.seats[r.seat].label).filter(Boolean); return [p.courts.building, p.courts.room, ...seats, p.labels.publicAccess, p.labels.restrictedAccess];",
  captions: "return [p.actorLabels.participant, p.objectLabels.route, p.objectLabels.door, p.locale === 'es' ? 'Todos sentados (según lo aportado)' : 'Everyone seated (as supplied)'];",
});

// ---------------------------------------------------------------------------------------------
// Rendered checks (every preset × ratio × labels shown/hidden). Distances in px at 1080p.
const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const HEADS = "const heads = [...svg.querySelectorAll('[data-node$=\"-head\"]')].filter(e => /^p\\d+-head$/.test(e.getAttribute('data-node'))).map(bx);";
// every visible card (seat labels, room name, notes, panel texts) is clear of every head
const NO_CARD_ON_FACE = `(() => { ${K} ${BOX} ${HEADS}
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^(lab\\d+-body|room-name|state-tag|note\\d+|key|bld-name|legend-\\w+)$/.test(e.getAttribute('data-node')) && visible(e)).map(bx);
  return cards.every(c => heads.every(h => !hit(c, h, 1)));
})()`;
// each seat label: its chip lies within 40 px of its own person, the leader ends on that person, and the leader
// crosses no other text, chip or head
const LABEL_OWNS_SEAT = `(() => { ${K} ${BOX} ${HEADS}
  const labs = [...svg.querySelectorAll('[data-node^="lab"]')].filter(e => /^lab\\d+$/.test(e.getAttribute('data-node')) && visible(e));
  if (!labs.length) return false;
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
  for (const lab of labs) {
    const i = lab.getAttribute('data-node').slice(3);
    const body = bx(svg.querySelector('[data-node="lab' + i + '-body"]'));
    const pb = bx(svg.querySelector('[data-node="' + lab.getAttribute('data-owner') + '"]'));
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
// owner proximity: each seat chip is nearer its own occupant (or own chair) than any other person or chair
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
  return ps.length > 0 && ps.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); const b = e.getBoundingClientRect(); return hd.width / K >= 26 && Math.max(b.width, b.height) / K >= 60; });
})()`;
// the scene (plan + building + panel) fills the caption-safe box (>= 90 % on its long axis, >= 72 % on the other)
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
// everything drawn stays inside the frame
const IN_FRAME = "(() => { const vb = svg.viewBox.baseVal; const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); return p1.x >= -1 && p1.y >= -1 && p2.x <= vb.width + 1 && p2.y <= vb.height + 1; })()";
// people never fade: whoever is drawn is whole and opaque at every time
const OPAQUE = "[...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node'))).every(e => visible(e) && !e.getAttribute('opacity'))";
// equal visual weight of the two routes: same badge size, same route-line width, same door leaf; nothing dashed on
// either route (dashes mean disputed); the route lines are drawn solid (draw-on dash >= the path length)
const EQUAL_ROUTES = `(() => {
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  const a = q('rm-badge-public').getBoundingClientRect(), b = q('rm-badge-restricted').getBoundingClientRect();
  if (Math.abs(a.width - b.width) > 0.5 || Math.abs(a.height - b.height) > 0.5) return false;
  const la = q('rm-door-public-leaf').getBBox(), lb = q('rm-door-restricted-leaf').getBBox();
  if (Math.abs(Math.max(la.width, la.height) - Math.max(lb.width, lb.height)) > 0.5) return false;
  const lines = [...svg.querySelectorAll('[data-node]')].filter(e => /^trail\\d+-line$/.test(e.getAttribute('data-node')));
  const widths = new Set(lines.map(e => e.getAttribute('stroke-width')));
  if (widths.size > 1) return false;
  for (const e of lines) { const L = e.getTotalLength(); const d = (e.getAttribute('stroke-dasharray') || '').split(/[ ,]+/).map(Number); if (d.length && d[0] < L - 1 && d[0] > 0) return false; }
  for (const n of ['rm-door-public', 'rm-door-restricted', 'rm-badge-public', 'rm-badge-restricted']) if ([...q(n).querySelectorAll('*')].some(e => e.getAttribute('stroke-dasharray'))) return false;
  return true;
})()`;
// no directed link or arrowhead is drawn anywhere
const NO_ARROWS = "![...svg.querySelectorAll('[data-node]')].some(e => /-head$/.test(e.getAttribute('data-node')) && !/^p\\d+-head$/.test(e.getAttribute('data-node')) && visible(e)) && !svg.querySelector('[marker-end], marker')";

// seat chips keep off every other participant's route line (sampled on the rendered paths)
const CHIPS_OFF_ROUTES = `(() => {
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^lab\\d+-body$/.test(e.getAttribute('data-node')) && visible(e));
  const lines = [...svg.querySelectorAll('[data-node]')].filter(e => /^trail\\d+-line$/.test(e.getAttribute('data-node')) && visible(e));
  for (const b of labs) {
    const r = b.getBoundingClientRect();
    for (const ln of lines) {
      const m = ln.getScreenCTM(), L = ln.getTotalLength();
      for (let j = 0; j <= 200; j++) { const q = ln.getPointAtLength(L * j / 200).matrixTransform(m); if (q.x > r.left && q.x < r.right && q.y > r.top && q.y < r.bottom) return false; }
    }
  }
  return true;
})()`;


// review 1 (LAW-0217): seat chips stay off every mark: the note rings/markers, the corner plants and the route badges
const CHIPS_OFF_MARKS = `(() => {
  const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
  const bx = e => e.getBoundingClientRect();
  const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^lab\\d+-body$/.test(e.getAttribute('data-node')) && eff(e) > 0.05).map(bx);
  const marks = [...svg.querySelectorAll('[data-node="notes"] circle, [data-node^="rm-plant"], [data-node^="rm-badge-"]')].filter(e => eff(e) > 0.05 && bx(e).width > 0.5).map(bx);
  return labs.every(l => marks.every(m => !hit(l, m)));
})()`;


// AUTHORING: baseline presets (baseline-es included) render every visible text >= 19.5 px (1080p) in every ratio
const TEXT_195 = `(() => { const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
  const s0 = svg.getScreenCTM().a; const vb = svg.viewBox.baseVal;
  const ts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]') && eff(t) >= 0.05 && (t.textContent || '').trim() && t.getBoundingClientRect().width >= 0.5);
  return ts.length > 0 && ts.every(t => parseFloat(getComputedStyle(t).fontSize) * (t.getScreenCTM().a / s0) * 1080 / Math.min(vb.width, vb.height) >= 19.5 - 0.05);
})()`;

ratioChecks(ID, 'cards off faces, labels own their seats, people large, equal routes, plan fills the frame', [
  {at: times(0, 1, 0.05), dom: NO_CARD_ON_FACE, label: 'rendered: no card, chip or note covers a head'},
  {at: [0.82, 1], tv: ['all'], dom: LABEL_OWNS_SEAT, label: 'rendered: each label within 40 px of its own person, its leader ends on that person and crosses no text, chip or head'},
  {at: [0.82, 1], tv: ['all'], dom: NEAREST_IS_OWNER, label: 'rendered: each seat chip is nearer its own occupant than any other person or chair (empty or taken)'},
  {at: [0, 0.15, 0.5, 0.8, 1], dom: PEOPLE_SIZE, label: 'rendered: people >= 60 px across (shoulder span, any facing) and heads >= 26 px (1080p) at rest, during the walk and at the hold'},
  {at: [1], dom: FILL, label: 'rendered: the plan and the building fill the caption-safe box (labels shown and hidden)'},
  {at: [0, 0.5, 1], dom: IN_FRAME, label: 'rendered: nothing leaves the frame'},
  {at: times(0, 1, 0.1), dom: OPAQUE, label: 'rendered: people are always whole and opaque (nobody fades in)'},
  {at: [0.5, 1], dom: EQUAL_ROUTES, label: 'rendered: both routes have equal weight (badges, doors, solid route lines; nothing dashed)'},
  {at: [0, 0.5, 1], dom: NO_ARROWS, label: 'rendered: no directed link or arrowhead anywhere'},
  {at: [0], fn: 's.startOutside', label: 'everyone starts outside the room, in a corridor'},
  {at: [1], tv: ['all'], fn: 's.labelsPlaced', label: 'every label placed beside its seat (no fallback)'},
  {at: [0.5, 0.8, 1], tv: ['all'], dom: CHIPS_OFF_ROUTES, label: 'rendered: no seat chip lies over any route line (its own included)'},
  {at: [0.5, 0.8, 0.9, 1], tv: ['all'], dom: CHIPS_OFF_MARKS, label: 'rendered: no seat chip lies over a note ring or marker, a plant or a route badge'},
  {at: [1], tv: ['all'], fn: 's.chipsOffAllRoutes', label: 'every seat chip keeps off every route line, drawn or still to be walked'},
  {at: [0.1, 0.5, 1], tv: ['all'], presets: ['baseline-illustrative', 'baseline-es'], dom: TEXT_195, label: 'rendered: baseline and baseline-es: every visible text >= 19.5 px in every ratio'},
  {at: [0.3, 0.5, 0.65], fn: "s.labels.every((l, i) => l === 0 || s.states[i] === 'seated')", label: 'labels never arrive before their occupant lands'},
]);

// A person enters the room only through a door (rendered at 60 fps in 16:9): a person inside the room at frame n+1
// who was outside at frame n crossed the wall at a door gap.
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

// Coordinator decision 2026-09-26: visible text is never below 16 px at 1080p, at every sampled time.
test.describe(`${ID} text size over time`, () => {
  test(`${ID}: every visible text ≥ 16 px at every sampled u`, async ({page}) => {
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
});

// Coordinator decision (courts-02 review 1): no shipped preset or default supplies a directed link between
// institutions. This scene has no link field at all; every supplied object with a `kind` must be a plain relation,
// and the route field only names an access route (public | restricted), never a direction between institutions.
test(`${ID}: no shipped preset or default supplies a directed link between institutions`, async () => {
  const def = (await import('../../src/animations/courts/LAW-0217.js')).default;
  const bad = [];
  const walk = (o, path) => {
    if (Array.isArray(o)) o.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (k === 'kind' && v !== 'relation') bad.push(`${path}.kind=${v}`); walk(v, `${path}.${k}`); }
  };
  for (const pr of [{name: 'default', params: def.defaultParams}, ...presetsFor(ID)]) {
    walk(pr.params, pr.name);
    (pr.params.routes ?? def.defaultParams.routes).forEach((r, i) => { if (Object.keys(r).some(k => !['seat', 'access'].includes(k))) bad.push(`${pr.name} routes[${i}] has extra keys`); });
  }
  expect(Object.keys(def.paramsSchema.properties)).not.toContain('relationships');
  expect(bad).toEqual([]);
});
