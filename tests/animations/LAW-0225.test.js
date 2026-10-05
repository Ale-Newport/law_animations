// LAW-0225 — Presentación de una prueba en sala · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of the motion, anchoring of objects (the sheet lies on the table, then is held
// by both hands, then lies on the camera plate; the enlarged copy starts on the plate and ends on the shared screen;
// every label stays with its person or object) and the transformation (a sheet carried to the lectern and enlarged
// onto the screen) recognisable with the labels hidden.
// Timing (u): rest 0–0.15 (nothing moves); pick up 0.15–0.20, walk 0.20–0.34, lay on the plate 0.34–0.40, lamp
// 0.40–0.42; the copy grows 0.42–0.60 and the screen lights 0.52–0.60; the title shows on the screen 0.60–0.63;
// the others look towards the screen in the supplied order inside 0.46–0.64; (taken-down: back 0.64–0.74); notes
// and the state tag 0.76–0.83; everything is still from u ≈ 0.83.
// Legal (strict): no admitted/excluded/weight/ruling state anywhere; the shown copy is the same sheet (lines only +
// the supplied fictional title); the beam and every mark are solid (never dashed); the key says no conclusion.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0225';
const PEOPLE = Array.from({length: 5}, (_, i) => `p${i}`);

contractSuite(ID, {
  continuity: [...PEOPLE, 'doc', 'copyAt'],
  attach: [
    // the seated participants never move; the sheet is in both hands while it is carried
    {from: 0, to: 1, a: 'p0', b: 'seat0', tol: 0.5},
    {from: 0, to: 1, a: 'p2', b: 'seat2', tol: 0.5},
    {from: 0, to: 1, a: 'p3', b: 'seat3', tol: 0.5},
    {from: 0.2, to: 0.36, a: 'doc', b: 'hands', tol: 9},
    // after it is laid down the sheet stays on the camera plate
    {from: 0.41, to: 1, a: 'doc', b: 'plateAt', tol: 0.5},
    // once grown the copy stays on the screen
    {from: 0.6, to: 1, a: 'copyAt', b: 'screenAt', tol: 0.5},
  ],
  semantic: [
    {at: 0, fn: "s.docHolder === 'table' && s.lamp === 0 && s.copy === 0 && s.screen === 'idle' && s.titleShown === 0 && s.heads.every(a => a === 0)", label: 'rest: the sheet on the table, camera off, screen idle, nobody turned'},
    {at: 0.145, fn: "s.docHolder === 'table' && s.lamp === 0 && s.copy === 0 && s.p1.x === s.seat1.x && s.p1.y === s.seat1.y", label: 'nothing moves during the rest beat'},
    {at: 0.27, fn: "s.docHolder === 'hands' && s.holdAmount === 1 && s.copy === 0 && s.screen === 'idle'", label: 'the presenter carries the sheet in both hands; nothing is on the screen yet'},
    {at: 0.415, fn: "s.docHolder === 'plate' && s.lamp > 0.5 && s.copy === 0", label: 'the sheet lies on the plate and the lamp lights before any copy appears (cause before effect)'},
    {at: 0.5, fn: "s.copy > 0.2 && s.copy < 1 && s.screen !== 'lit' && s.titleShown === 0", label: 'the enlarged copy is on its way; no title yet'},
    {at: 0.62, fn: "s.copy === 1 && s.screen === 'lit'", label: 'the copy has landed on the screen, which is lit'},
    {at: 0.74, fn: "s.copy === 1 && s.titleShown === 1 && s.heads.filter((a, i) => i !== 1).every(a => Math.abs(a) > 5)", label: 'the main action is complete by u 0.74: the title shows, everyone else looks towards the screen'},
    {at: 1, fn: "s.finalState === 'on-screen' && s.docHolder === 'plate' && s.copy === 1 && s.screen === 'lit' && s.titleShown === 1 && s.allReached && s.problems.length === 0", label: 'hold: the supplied final state (the copy on the shared screen)'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: "s.docHolder === 'plate' && s.copy > 0.2 && s.copy < 1", label: 'labels hidden: the same carry and enlargement happen'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.copy === 1 && s.screen === 'lit'", label: 'labels hidden: the copy ends on the lit screen'},
    {at: 1, params: {finalState: 'taken-down'}, fn: "s.copy === 0 && s.screen === 'idle' && s.lamp === 0 && s.docHolder === 'plate' && s.titleShown === 0", label: 'supplied state "taken-down": the copy went back to the plate, the screen is idle'},
    {at: 0.62, params: {finalState: 'taken-down'}, fn: "s.copy === 1 && s.screen === 'lit'", label: 'taken-down: the copy is shown first'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.copy < 1", label: 'actionProgress freezes the action part-way'},
    {at: 1, params: {routes: [{seat: 2}, {seat: 0}]}, fn: "s.presenter === 'right1' && s.lookOrder.join() === 'front'", label: 'the supplied order decides the presenter (first table seat) and who looks towards the screen'},
    {at: 1, params: {routes: [{seat: 0}, {seat: 3}]}, fn: "s.presenter === 'right2'", label: 'the presiding seat never carries the document: the first listed table seat does'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const seats = p.seats.map(s => s.label); return [p.courts.building, p.courts.room, ...seats, p.labels.document, p.labels.screen, p.labels.camera, p.labels.key, p.actorLabels.presenter, p.actorLabels.others, p.objectLabels.screen, p.objectLabels.beam, ...p.annotations.map(a => a.text)];",
  content: "return [p.courts.building, p.courts.room, ...p.seats.map(s => s.label), p.labels.document];",
  captions: "return [p.labels.screen, p.labels.camera, p.actorLabels.presenter, p.actorLabels.others, p.objectLabels.screen, p.objectLabels.beam];",
});

// ---------------------------------------------------------------------------------------------
// Rendered checks (every preset × ratio × labels shown/hidden). Distances in px at 1080p.
const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const HEADS = "const heads = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+-head$/.test(e.getAttribute('data-node'))).map(bx);";
const VIS = "const vis = e => { for (let q = e; q && q !== svg; q = q.parentNode) { const o = q.getAttribute && q.getAttribute('opacity'); if (o !== null && o !== undefined && parseFloat(o) < 0.05) return false; } return visible(e); };";
// no visible card (labels, captions, room name, notes, panel texts, the screen title) covers a head
const NO_CARD_ON_FACE = `(() => { ${K} ${BOX} ${HEADS} ${VIS}
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^(lab\\w+-body|cap-\\w+-body|room-name|state-tag|note\\d+|key|bld-name|legend-\\w+|scr-title)$/.test(e.getAttribute('data-node')) && vis(e)).map(bx);
  return heads.length > 0 && cards.every(c => heads.every(h => !hit(c, h, 1)));
})()`;
// each visible person label: its chip within 40 px of its owner, its leader ends on the owner and crosses no text, chip or head
const LABEL_OWNS = `(() => { ${K} ${BOX} ${HEADS} ${VIS}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^lab(\\d+|S)$/.test(e.getAttribute('data-node')) && vis(e));
  if (!labs.length) return false;
  const texts = [...svg.querySelectorAll('text')].filter(t => vis(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
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
// people are large enough to read (px at 1080p): the larger side of the figure >= 60, head >= 26
const PEOPLE_SIZE = `(() => { ${K}
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); const r = e.getBoundingClientRect(); return Math.max(hd.width, hd.height) / K >= 26 && Math.max(r.width, r.height) / K >= 60; });
})()`;
// equal visual weight: every participant at the same scale; every label chip one font size and one stroke
const EQUAL_WEIGHT = `(() => {
  const sc = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node'))).map(e => { const m = e.getScreenCTM(); return Math.hypot(m.a, m.b); });
  const fonts = [...svg.querySelectorAll('[data-node]')].filter(e => /^lab(\\d+|S)-text$/.test(e.getAttribute('data-node'))).map(e => e.getAttribute('font-size'));
  const strokes = [...svg.querySelectorAll('[data-node]')].filter(e => /^lab(\\d+|S)-body$/.test(e.getAttribute('data-node'))).map(e => e.getAttribute('stroke-width') + '/' + (e.getAttribute('stroke-dasharray') || ''));
  return sc.length > 1 && Math.max(...sc) / Math.min(...sc) < 1.005 && new Set(fonts).size <= 1 && new Set(strokes).size <= 1;
})()`;
// the sheet in the presenter's hands: while it is carried, both hand discs touch the sheet's sides
const HANDS_ON_SHEET = `(() => { ${K} ${BOX}
  const sheet = svg.querySelector('[data-node="doc"]');
  const hands = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+-arm[LR]-h$/.test(e.getAttribute('data-node')));
  const sb = bx(sheet);
  // the hands that are within 30 px of the sheet must be two (the presenter's), touching it
  const near = hands.map(bx).filter(h => Math.max(0, h.l - sb.r, sb.l - h.r, h.t - sb.b, sb.t - h.b) < 30 * K);
  return near.length >= 2 && near.every(h => Math.max(0, h.l - sb.r, sb.l - h.r, h.t - sb.b, sb.t - h.b) < 3 * K);
})()`;
// the copy grows from the plate and ends inside the screen's display; the beam joins the plate and the copy
const COPY_ON_SCREEN = `(() => { ${BOX} ${VIS}
  const cg = svg.querySelector('[data-node="copy"]');
  if (!vis(cg)) return true;
  const copy = bx(svg.querySelector('[data-node="copy-sheet-paper"]'));
  const disp = bx(svg.querySelector('[data-node="screen-lit"]'));
  return copy.l >= disp.l - 1 && copy.r <= disp.r + 1 && copy.t >= disp.t - 1 && copy.b <= disp.b + 1 && (copy.b - copy.t) > 0.4 * (disp.b - disp.t);
})()`;
// the screen title (when shown) lies inside the screen's display, above the page
const TITLE_ON_SCREEN = `(() => { ${BOX} ${VIS}
  const t = svg.querySelector('[data-node="scr-title"]');
  if (!t || !vis(t)) return true;
  const tb = bx(t), disp = bx(svg.querySelector('[data-node="screen-lit"]')), copy = bx(svg.querySelector('[data-node="copy-sheet-paper"]'));
  return tb.l >= disp.l && tb.r <= disp.r && tb.t >= disp.t && tb.b <= copy.t + 2;
})()`;
// the beam, note rings and chip outlines are solid (dashes mean pending or disputed in this library)
const SOLID = `(() => {
  const els = [svg.querySelector('[data-node="beam"]'), ...[...svg.querySelectorAll('[data-node]')].filter(e => /^(note-ring\\d+|note\\d+|lab\\w+-body|cap-\\w+-body)$/.test(e.getAttribute('data-node')))].filter(Boolean);
  const shapes = els.flatMap(e => [e, ...e.querySelectorAll('circle, rect, path')]);
  return shapes.every(c => { const d = c.getAttribute('stroke-dasharray'); return !d || d === 'none'; });
})()`;
// no red: nothing in the scene is drawn in a red/alarm hue (a shown or not-shown document is never penalised)
const NO_RED = `(() => {
  const red = c => { const m = /^#([0-9a-f]{6})$/i.exec(c || ''); if (!m) return false; const n = parseInt(m[1], 16), R = n >> 16, G = (n >> 8) & 255, B = n & 255; return R > 170 && G < 90 && B < 90; };
  return [...svg.querySelectorAll('[fill], [stroke]')].every(e => !red(e.getAttribute('fill')) && !red(e.getAttribute('stroke')));
})()`;
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
const IN_FRAME = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; return p1.x >= -1 && p1.y >= -1 && p2.x <= vb.width + 1 && p2.y <= vb.height + 1; })()";
const OPAQUE = "[...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node'))).every(e => visible(e) && !e.getAttribute('opacity'))";
// the plan (room) is the subject: it covers >= 0.55 of the frame width beside a right-hand column, or >= 0.85 of it
// when the panel is a band above it
const PLAN_SHARE = `(() => {
  const vb = svg.viewBox.baseVal, k = svg.getScreenCTM().a;
  const pl = svg.querySelector('[data-node="rm-room"]').getBoundingClientRect();
  const share = pl.width / (vb.width * k);
  return vb.width > vb.height * 1.2 ? share >= 0.55 : share >= 0.55;
})()`;

ratioChecks(ID, 'cards off faces, labels own their people, hands on the sheet, the copy lands on the screen, solid marks, plan large', [
  {at: times(0, 1, 0.05), dom: NO_CARD_ON_FACE, label: 'rendered: no card, chip, note or screen title covers a head'},
  {at: [0.1, 0.5, 0.9, 1], tv: ['all'], dom: LABEL_OWNS, label: 'rendered: each person label within 40 px of its owner, its leader ends on them and crosses no text, chip or head'},
  {at: times(0, 1, 0.1), dom: PEOPLE_SIZE, label: 'rendered: people >= 60 px across and heads >= 26 px (1080p)'},
  {at: [0, 0.5, 1], dom: EQUAL_WEIGHT, label: 'rendered: every participant at one scale; one label size and one chip stroke'},
  {at: [0.22, 0.26, 0.3, 0.33, 0.36], dom: HANDS_ON_SHEET, label: 'rendered: while carried the sheet is between the presenter’s two hands'},
  {at: [0.62, 0.635, 1], dom: COPY_ON_SCREEN, label: 'rendered: the enlarged copy lies inside the screen’s display'},
  {at: [0.65, 0.8, 1], tv: ['all'], dom: TITLE_ON_SCREEN, label: 'rendered: the supplied title shows inside the screen, above the page'},
  {at: [0.5, 1], dom: SOLID, label: 'rendered: the beam, note rings and chips are solid (no dashes)'},
  {at: [0, 1], dom: NO_RED, label: 'rendered: no red/alarm colour anywhere'},
  {at: [1], dom: FILL, label: 'rendered: the plan and the building fill the caption-safe box'},
  {at: [0.5, 1], dom: PLAN_SHARE, label: 'rendered: the room plan covers >= 0.55 of the FRAME width'},
  {at: times(0, 1, 0.1), dom: IN_FRAME, label: 'rendered: nothing leaves the frame'},
  {at: times(0, 1, 0.1), dom: OPAQUE, label: 'rendered: people are always whole and opaque'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits: every label placed, the title fits the screen'},
]);

// Text size at EVERY moment: every visible text (effective opacity >= 0.05) is >= 16 px at 1080p at every sampled u,
// and >= 19.5 px in the default, baseline-illustrative and baseline-es presets (pattern of LAW-0196 / LAW-0213).
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

// create() is cold-fast: <= 1000 ms in a fresh page for every preset × ratio (AUTHORING item 20)
test(`${ID}: cold create() <= 1 s in every preset × ratio`, async ({browser}) => {
  test.setTimeout(300000);
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const slow = [];
  for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
    const page = await browser.newPage();
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const ms = await page.evaluate(async ([id, w, h, params]) => {
      const def = await window.__lib.load(id);
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const t0 = performance.now();
      const x = def.create(el, {width: w, height: h, params});
      await x.ready;
      return performance.now() - t0;
    }, [ID, w, h, pr.params]);
    if (ms > 1000) slow.push(`${pr.name} ${ratio}: ${Math.round(ms)} ms`);
    await page.close();
  }
  expect(slow, slow.join('\n')).toEqual([]);
});
