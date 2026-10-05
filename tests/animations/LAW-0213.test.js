// LAW-0213 — Sala física y remota · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion, anchoring of objects (each person stays on their seat or in
// their window, each label stays with its person, each link stays attached to its bench hub and its window), and
// the transformation (people walking in through the door and sitting; the bench drawing solid links to the remote
// windows, whose participants then sit) recognisable with the labels hidden.
// Timing (u): rest 0–0.15 (nothing moves); arrivals are staggered inside 0.16–0.72 in the supplied order (a walk
// for a room seat, a link draw + sit for a window); each label arrives body-first once its participant is seated;
// notes and the state tag fade in 0.75–0.82; everything is still from u ≈ 0.82.
// Legal (strict): where each participant appears is only shown as supplied — the same person size, label size
// and stroke style in the room and in a window; links are solid (never dashed); the key says no conclusion.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0213';
const PEOPLE = Array.from({length: 6}, (_, i) => `p${i}`);

contractSuite(ID, {
  continuity: PEOPLE,
  // once everyone has arrived each person stays exactly on their seat; window participants never move at all
  attach: [
    ...Array.from({length: 5}, (_, i) => ({from: 0.73, to: 1, a: `p${i}`, b: `seat${i}`, tol: 0.5})),
    {from: 0, to: 1, a: 'p2', b: 'seat2', tol: 0.5},
    {from: 0, to: 1, a: 'p4', b: 'seat4', tol: 0.5},
  ],
  semantic: [
    {at: 0, fn: "s.states.every(x => x === 'waiting') && s.labels.every(l => l === 0) && s.seated === 0 && s.startOutside && !s.linked.some(Boolean)", label: 'rest: room participants wait in the corridor, windows not yet linked, no label shown'},
    {at: 0.145, fn: "s.states.every(x => x === 'waiting') && s.labels.every(l => l === 0) && !s.linked.some(Boolean)", label: 'nothing moves or links during the rest beat'},
    {at: 0.3, fn: "s.states.some(x => x !== 'waiting') && s.labels.every((l, i) => l === 0 || s.states[i] === 'seated')", label: 'the arrivals start; a label only shows for a seated participant'},
    ...[0.2, 0.25, 0.35, 0.45, 0.55, 0.65, 0.7].map(at => ({at, fn: "s.labels.every((l, i) => l === 0 || s.states[i] === 'seated') && s.linked.every((v, i) => !v || s.states[i] === 'sitting' || s.states[i] === 'seated')", label: `labels never before the participant is seated; a window participant sits only after its link lands (u=${at})`})),
    {at: 0.5, fn: "s.seated >= 1 && s.states.some(x => x !== 'seated')", label: 'mid-way: some in place, others still arriving'},
    {at: 0.74, fn: "s.states.every(x => x === 'seated')", label: 'the main action is complete by u 0.74'},
    {at: 0.82, fn: 's.labels.every(l => l === 1)', label: 'every label is fully shown by u 0.82'},
    {at: 1, fn: "s.states.every(x => x === 'seated') && s.labels.every(l => l === 1) && s.kinds.every((k, i) => k === 'room' ? s.linked[i] === null : s.linked[i] === true) && s.finalState === 'all-in-place' && s.allReached", label: 'hold: everyone in place (supplied final state), every window linked, every label shown'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: "s.seated >= 1 && s.states.some(x => x !== 'seated')", label: 'labels hidden: the same walks and links happen'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.states.every(x => x === 'seated') && s.linked.filter(v => v !== null).every(Boolean)", label: 'labels hidden: everyone ends in place, windows linked'},
    {at: 1, params: {finalState: 'last-waiting'}, fn: "s.states[s.states.length - 1] === 'waiting' && s.states.slice(0, -1).every(x => x === 'seated') && s.linked[s.linked.length - 1] === false", label: 'supplied state: the last participant (a window) is not yet linked'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.actionCapped && s.states.some(x => x !== 'seated')", label: 'actionProgress freezes the arrivals part-way'},
    {at: 1, params: {routes: [{seat: 2}, {seat: 0}]}, fn: "s.order === 'win1>front' && s.states.length === 2 && s.kinds.join() === 'window,room'", label: 'the supplied routes decide who arrives, where and in which order'},
    {at: 1, fn: 's.labelsPlaced', label: 'every label found a place beside its participant'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const seats = p.routes.map(r => p.seats[r.seat] && p.seats[r.seat].label).filter(Boolean); return [p.courts.building, p.courts.room, ...seats, p.labels.mainDoor, p.labels.key, p.actorLabels.inRoom, p.actorLabels.remote, p.objectLabels.bench, p.objectLabels.link, ...p.annotations.map(a => a.text)];",
  content: "const seats = p.routes.map(r => p.seats[r.seat] && p.seats[r.seat].label).filter(Boolean); return [p.courts.building, p.courts.room, ...seats];",
  captions: "return [p.labels.mainDoor, p.actorLabels.inRoom, p.actorLabels.remote, p.objectLabels.bench, p.objectLabels.link];",
});

// ---------------------------------------------------------------------------------------------
// Rendered checks (every preset × ratio × labels shown/hidden). Distances in px at 1080p.
const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const HEADS = "const heads = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+-head$/.test(e.getAttribute('data-node'))).map(bx);";
// every visible card (labels, door caption, room name, notes, panel texts, building name) is clear of every head
const NO_CARD_ON_FACE = `(() => { ${K} ${BOX} ${HEADS}
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^(lab\\d+-body|door-cap0-body|room-name|state-tag|note\\d+|key|bld-name|legend-\\w+)$/.test(e.getAttribute('data-node')) && visible(e)).map(bx);
  return heads.length > 0 && cards.every(c => heads.every(h => !hit(c, h, 1)));
})()`;
// each label: its chip lies within 40 px of its own participant, the leader ends on that participant, and the
// leader crosses no other text, chip or head
const LABEL_OWNS = `(() => { ${K} ${BOX} ${HEADS}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^lab\\d+$/.test(e.getAttribute('data-node')) && visible(e));
  if (!labs.length) return false;
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
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
    const others = [...texts.filter(t => !lab.contains(t)).map(bx), ...labs.filter(o => o !== lab).map(o => bx(svg.querySelector('[data-node="' + o.getAttribute('data-node') + '-body"]'))), ...heads];
    if (pts.some(q => others.some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b))) return false;
  }
  return true;
})()`;
// owner proximity: each chip is nearer its own participant (or own chair / window) than any other person or chair
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
    const own = [owner, /^win-/.test(lab.getAttribute('data-seat')) ? null : seat].filter(Boolean).map(ctr);
    const d0 = Math.min(...own.map(q => dist(body, q)));
    const others = [...chairs, ...people].filter(q => q.e !== owner && q.e !== seat && own.every(o => Math.hypot(o.x - q.x, o.y - q.y) > 4 * K));
    return others.every(q => dist(body, q) > d0);
  });
})()`;
// people are large enough to read (px at 1080p): the shoulder span (the larger side of the figure) >= 60, head >= 26
const PEOPLE_SIZE = `(() => { ${K}
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); const r = e.getBoundingClientRect(); return Math.max(hd.width, hd.height) / K >= 26 && Math.max(r.width, r.height) / K >= 60; });
})()`;
// equal visual weight: every participant (room or window) is drawn at the same scale (same head size), and every
// label chip uses the same font size and stroke
const EQUAL_WEIGHT = `(() => {
  const heads = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node'))).map(e => { const m = e.getScreenCTM(); return Math.hypot(m.a, m.b); });
  const fonts = [...svg.querySelectorAll('[data-node]')].filter(e => /^lab\\d+-text$/.test(e.getAttribute('data-node'))).map(e => e.getAttribute('font-size'));
  const strokes = [...svg.querySelectorAll('[data-node]')].filter(e => /^lab\\d+-body$/.test(e.getAttribute('data-node'))).map(e => e.getAttribute('stroke-width') + '/' + (e.getAttribute('stroke-dasharray') || ''));
  return heads.length > 1 && Math.max(...heads) / Math.min(...heads) < 1.005 && new Set(fonts).size <= 1 && new Set(strokes).size <= 1;
})()`;
// links: solid (only the draw-on dash, no dash pattern), same width, starting on a bench hub and ending on their window
const LINKS = `(() => { ${K} ${BOX}
  const lines = [...svg.querySelectorAll('[data-node]')].filter(e => /^link\\d+-line$/.test(e.getAttribute('data-node')));
  const widths = new Set(lines.map(e => e.getAttribute('stroke-width')));
  if (widths.size > 1) return false;
  for (const ln of lines) {
    const da = (ln.getAttribute('stroke-dasharray') || '').split(/[ ,]+/).map(Number);
    if (da.length && da[0] && da[0] < ln.getTotalLength() - 1) return false;
    if (!visible(ln.parentNode) || parseFloat(ln.parentNode.getAttribute('opacity') || 1) < 0.5) continue;
    const m = ln.getScreenCTM(), L = ln.getTotalLength();
    const A = ln.getPointAtLength(0).matrixTransform(m), Z = ln.getPointAtLength(L).matrixTransform(m);
    const hubs = [...svg.querySelectorAll('[data-node^="rm-hub-"]')].map(bx);
    if (!hubs.some(b => A.x >= b.l - 3 && A.x <= b.r + 3 && A.y >= b.t - 3 && A.y <= b.b + 3)) return false;
    const wins = [...svg.querySelectorAll('[data-node^="win-"]')].filter(e => /^win-win\\d$/.test(e.getAttribute('data-node'))).map(bx);
    if (!wins.some(b => Z.x >= b.l - 4 && Z.x <= b.r + 4 && Z.y >= b.t - 4 && Z.y <= b.b + 4)) return false;
  }
  return true;
})()`;
// the links cross no head and no text; two links never run within 20 px of each other for more than 120 px
const LINKS_CLEAR = `(() => { ${K} ${BOX} ${HEADS}
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]')).map(bx);
  const lines = [...svg.querySelectorAll('[data-node]')].filter(e => /^link\\d+-line$/.test(e.getAttribute('data-node')) && visible(e.parentNode) && parseFloat(e.parentNode.getAttribute('opacity') || 1) > 0.5).map(ln => {
    const m = ln.getScreenCTM(), L = ln.getTotalLength(), pts = [];
    for (let j = 0; j <= 80; j++) pts.push(ln.getPointAtLength((L * j) / 80).matrixTransform(m));
    return {pts, len: L * m.a};
  });
  for (const ln of lines) for (const q of ln.pts) if ([...heads, ...texts].some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b)) return false;
  for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
    let run = 0; const step = lines[i].len / 80;
    for (const q of lines[i].pts.slice(4)) { const close = lines[j].pts.slice(4).some(z => Math.hypot(z.x - q.x, z.y - q.y) < 20 * K); run = close ? run + step : 0; if (run > 120 * K) return false; }
  }
  return true;
})()`;
// the scene (plan + building) fills the caption-safe box (>= 90 % on its long axis, >= 72 % on the other)
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
// nothing leaves the frame: the scene's bounds stay inside the viewBox
const IN_FRAME = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; return p1.x >= -1 && p1.y >= -1 && p2.x <= vb.width + 1 && p2.y <= vb.height + 1; })()";
// people never fade: whoever is drawn is whole and opaque at every time
const OPAQUE = "[...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node'))).every(e => visible(e) && !e.getAttribute('opacity'))";

// note rings and their legend marks are solid (dashes mean pending or disputed); a ring group that covers more
// than one target draws every ring at one size, so no participant is singled out
const NOTE_RINGS = "[...svg.querySelectorAll('[data-node]')].filter(e => /^(note-ring\\d+|note\\d+)$/.test(e.getAttribute('data-node'))).every(gr => { const sh = [...gr.querySelectorAll('circle, rect')].filter(c => c.getAttribute('fill') === 'none'); if (sh.some(c => { const d = c.getAttribute('stroke-dasharray') || getComputedStyle(c).strokeDasharray; return d && d !== 'none'; })) return false; const rs = sh.filter(c => c.tagName === 'circle').map(c => +c.getAttribute('r')); return rs.every(v => Math.abs(v - rs[0]) < 0.5); })";
ratioChecks(ID, 'cards off faces, labels own their people, equal weight, solid links, people large, plan fills the frame', [
  {at: times(0, 1, 0.05), dom: NO_CARD_ON_FACE, label: 'rendered: no card, chip or note covers a head'},
  {at: [0.82, 1], tv: ['all'], dom: LABEL_OWNS, label: 'rendered: each label within 40 px of its own participant, its leader ends on them and crosses no text, chip or head'},
  {at: [0.82, 1], tv: ['all'], dom: NEAREST_IS_OWNER, label: 'rendered: each chip is nearer its own participant than any other person or chair'},
  {at: times(0, 1, 0.1), dom: PEOPLE_SIZE, label: 'rendered: people >= 60 px across and heads >= 26 px (1080p) at rest, during the action and at the hold'},
  {at: [0, 1], dom: EQUAL_WEIGHT, label: 'rendered: room and window participants share one person scale, one label size and one chip stroke'},
  {at: times(0.16, 1, 0.04), dom: LINKS, label: 'rendered: links are solid, of one width, start on a bench hub and end on their window'},
  {at: [0.74, 1], dom: LINKS_CLEAR, label: 'rendered: links cross no head and no text; no two links run as a tight parallel pair'},
  {at: [0.9, 1], tv: ['all'], dom: NOTE_RINGS, label: 'rendered: note rings and note marks are solid; a multi-target ring group uses one ring size'},
  {at: [1], dom: FILL, label: 'rendered: the plan and the building fill the caption-safe box (labels shown and hidden)'},
  {at: times(0, 1, 0.1), dom: IN_FRAME, label: 'rendered: nothing leaves the frame'},
  {at: times(0, 1, 0.1), dom: OPAQUE, label: 'rendered: people are always whole and opaque (nobody fades in)'},
  {at: [0], fn: 's.startOutside', label: 'room participants start outside the room, in the corridor'},
  {at: [1], tv: ['all'], fn: 's.labelsPlaced', label: 'every label placed beside its participant (no fallback)'},
  {at: [0.3, 0.5, 0.65], fn: "s.labels.every((l, i) => l === 0 || s.states[i] === 'seated')", label: 'labels never arrive before their participant is seated'},
]);

// A room participant enters the room only through the door (rendered at 60 fps in 16:9): someone inside the room
// at frame n+1 who was outside at frame n crossed the wall at the door gap.
test(`${ID}: room participants enter only through the door gap (every preset, 16:9, 60 fps)`, async ({page}) => {
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

// Text size at EVERY moment: every visible text (effective opacity >= 0.05) is >= 16 px at 1080p at every sampled u,
// and >= 19.5 px in the default, baseline-illustrative and baseline-es presets (pattern of LAW-0194 / LAW-0196 / LAW-0688).
test.describe(`${ID} text size over time`, () => {
  test(`${ID}: every visible text >= 16 px (>= 19.5 px in baseline and baseline-es) at every sampled u`, async ({page}) => {
    test.setTimeout(300000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
        const floor = ['default', 'baseline-illustrative', 'baseline-es'].includes(pr.name) ? 19.5 : 16;
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
              if (pxs < floor - 0.05) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: "${t.textContent.slice(0, 24)}" ${pxs.toFixed(1)} px < ${floor}`);
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
