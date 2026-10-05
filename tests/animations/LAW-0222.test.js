// LAW-0222 — Organización de turnos · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends on its element, the order does not change on seek, and a relation is
// not drawn as causality by default (a plain relation has end dots and no arrowhead; a sequence link has an arrowhead
// and the caption "sequence as configured"; no shipped preset supplies a causal link).
// Timing (u): separate 0.03–0.16 (the lamps lift off the table, the sequence card settles); relationships draw one by
// one 0.19–0.42; the tracer runs 0.44–0.74 (the token passes while it runs from the signal to the receiver; the lamps
// switch when it reaches the lamps); the state tag fades in 0.76–0.82.
// Legal: participants, parties (● / ◆ badges of equal weight), the sequence and the relationships are as supplied; no
// required order, time per turn or consequence; the key says "as supplied · no conclusion drawn".
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0222';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['token', 'tracer'],
  semantic: [
    {at: 0, fn: "s.separated === 0 && s.drawn.every(v => v === 0) && s.holder === 'Participant B' && JSON.stringify(s.lamps) === JSON.stringify([1, 0])", label: 'start: assembled, nothing related yet; the first holder has the signal, lamp 1 lit'},
    {at: 0.17, fn: 's.separated === 1 && s.drawn.every(v => v === 0)', label: 'separate: the parts are apart before any relation is drawn'},
    {at: 0.3, fn: 's.drawn.some(v => v > 0) && s.drawn.some(v => v < 1)', label: 'relate: the relationships draw one by one'},
    {at: 0.43, fn: 's.drawn.every(v => v === 1) && !s.tracerOn', label: 'every supplied relationship is drawn before the tracer starts'},
    {at: 0.5, fn: 's.connectorsLanded && s.tracerOn', label: 'every connector ends on its own element; the tracer runs'},
    {at: 0.76, fn: "JSON.stringify(s.visited) === JSON.stringify(['sequence', 'holder', 'signal', 'receiver', 'lamps'])", label: 'the tracer visits the parts in the supplied order'},
    {at: 1, fn: "s.holder === 'Participant C' && JSON.stringify(s.lamps) === JSON.stringify([0, 1]) && s.allReached && s.connectorsLanded", label: 'gather: the receiver holds the signal and lamp 2 is lit (state); origin and relations stay'},
    {at: 1, fn: "JSON.stringify(s.kinds) === JSON.stringify(['sequence', 'sequence', 'relation']) && s.arrows === 2", label: 'only the supplied relationships, by kind (plain relation without an arrow)'},
    {at: 1, params: {relationships: [{from: 'signal', to: 'receiver', kind: 'relation'}]}, fn: "JSON.stringify(s.kinds) === JSON.stringify(['relation']) && s.arrows === 0", label: 'a plain relation is never drawn with an arrow'},
    {at: 1, params: {focusElement: 'lamps'}, fn: "s.focus === 'lamps'", label: 'the focus element is supplied'},
    ...[0.45, 0.5, 0.55, 0.6, 0.65, 0.7].map(at => ({at, fn: "s.lamps[1] === 0 || s.holder === 'Participant C'", label: `cause before effect: lamp 2 lights only once the token has arrived (u=${at})`})),
    {at: 0.8, params: {focusElement: 'lamps'}, fn: "s.lit === 1 && s.lamps[1] === 1 && s.holder === 'Participant C'", label: 'a lamp focus does not change the lamp sequence'},
    {at: 0.6, params: {textVisibility: 'none'}, fn: 's.tracerOn', label: 'labels hidden: the same tracing happens'},
    {at: 1, fn: 's.problems.length === 0', label: 'every caption placed; no fallback layout'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.courts.building, p.courts.room, ...p.routes.slice(0, 2).map(i => p.seats[i].label), p.labels.active, p.labels.pending, p.labels.key, ...p.elements.map(e => e.label), p.relationLabels.sequence, p.relationLabels.relation];",
  content: "return [p.courts.building, p.courts.room, ...p.routes.slice(0, 2).map(i => p.seats[i].label), p.labels.active, p.labels.pending];",
  captions: 'return [p.labels.circle, p.labels.diamond];',
});

// ---------------------------------------------------------------------------------------------
// Rendered checks (every preset × ratio × labels shown/hidden). Distances in px at 1080p.
const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const EFF = "const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };";
const HEADS = "const heads = [...svg.querySelectorAll('[data-node$=\"-head\"]')].filter(e => /^p\\d+-head$/.test(e.getAttribute('data-node'))).map(bx);";
// every visible card (seat chips, panel items, notes) is clear of every head
const NO_CARD_ON_FACE = `(() => { ${BOX} ${HEADS}
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^(lab\\d+-body|room-name|bld-name|state-tag|note\\d+|key|legend-\\w+)$/.test(e.getAttribute('data-node')) && visible(e)).map(bx);
  return heads.length > 0 && cards.every(c => heads.every(h => !hit(c, h, 1)));
})()`;
// each chip within 40 px of its own person, the leader ends on that person, crosses no other text, chip or head
const LABEL_OWNS_SEAT = `(() => { ${K} ${BOX} ${HEADS}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^lab\\d+$/.test(e.getAttribute('data-node')) && visible(e));
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
    const B = new DOMPoint(+line.getAttribute('x2'), +line.getAttribute('y2')).matrixTransform(m), A = new DOMPoint(+line.getAttribute('x1'), +line.getAttribute('y1')).matrixTransform(m);
    if (!(B.x >= pb.l - 2 && B.x <= pb.r + 2 && B.y >= pb.t - 2 && B.y <= pb.b + 2)) return false;
    const pts = Array.from({length: 10}, (_, j) => ({x: A.x + (B.x - A.x) * (0.1 + 0.8 * j / 9), y: A.y + (B.y - A.y) * (0.1 + 0.8 * j / 9)}));
    const others = [...texts.filter(t => !lab.contains(t)).map(bx), ...labs.filter(o => o !== lab).map(o => bx(svg.querySelector('[data-node="' + o.getAttribute('data-node') + '-body"]'))), ...heads];
    if (pts.some(q => others.some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b))) return false;
  }
  return true;
})()`;
// (unused)
const CHIPS_OFF_MARKS = `(() => { ${EFF} ${BOX}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^lab\\d+-body$/.test(e.getAttribute('data-node')) && eff(e) > 0.05).map(bx);
  const marks = [...svg.querySelectorAll('[data-node="notes"] circle, [data-node="notes"] rect, [data-node^="rm-plant"], [data-node^="rm-badge"], [data-node^="rm-lamp"], [data-node="token"], [data-node="rm-tray"]')].filter(e => eff(e) > 0.05 && e.getBoundingClientRect().width > 0.5).map(bx);
  return labs.every(l => marks.every(m => !hit(l, m)));
})()`;
// people and their heads are large enough to read (px at 1080p)
const PEOPLE_SIZE = `(() => { ${K}
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); const b = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').parentNode.getBoundingClientRect(); const s = e.getBoundingClientRect(); return hd.width / K >= 26 && Math.min(s.width, s.height) / K >= 60; });
})()`;
// the scene fills the caption-safe box (>= 90 % on its long axis, >= 72 % on the other)
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
const IN_FRAME = "(() => { const vb = svg.viewBox.baseVal; const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); return p1.x >= -1 && p1.y >= -1 && p2.x <= vb.width + 1 && p2.y <= vb.height + 1; })()";
const OPAQUE = "[...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node'))).every(e => visible(e) && !e.getAttribute('opacity'))";
// equal weight of the two parties: every party badge the same size; nothing in the plan is dashed
const EQUAL_PARTIES = `(() => {
  const bs = [...svg.querySelectorAll('[data-node^="rm-badge"]')].filter(e => /^rm-badge\\d+$/.test(e.getAttribute('data-node'))).map(e => e.getBoundingClientRect());
  if (bs.length < 2 || bs.some(b => Math.abs(b.width - bs[0].width) > 0.5 || Math.abs(b.height - bs[0].height) > 0.5)) return false;
  return ![...svg.querySelector('[data-node="plan"]').querySelectorAll('*')].some(e => e.getAttribute('stroke-dasharray'));
})()`;
const NO_MARKERS = "!svg.querySelector('[marker-end], marker')";
// the token is always under a hand, or gliding: while someone holds it, one of their hands covers it
const TOKEN_IN_HAND = `(() => { ${BOX}
  const tk = svg.querySelector('[data-node="token"]').getBoundingClientRect();
  const c = {x: (tk.left + tk.right) / 2, y: (tk.top + tk.bottom) / 2};
  const hands = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+-arm[LR]-h$/.test(e.getAttribute('data-node'))).map(e => e.getBoundingClientRect());
  return hands.some(hd => Math.hypot((hd.left + hd.right) / 2 - c.x, (hd.top + hd.bottom) / 2 - c.y) <= tk.width * 0.6);
})()`;
// AUTHORING: baseline presets (baseline-es included) render every visible text >= 19.5 px (1080p) in every ratio
const TEXT_195 = `(() => { ${EFF}
  const s0 = svg.getScreenCTM().a; const vb = svg.viewBox.baseVal;
  const ts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]') && eff(t) >= 0.05 && (t.textContent || '').trim() && t.getBoundingClientRect().width >= 0.5);
  return ts.length > 0 && ts.every(t => parseFloat(getComputedStyle(t).fontSize) * (t.getScreenCTM().a / s0) * 1080 / Math.min(vb.width, vb.height) >= 19.5 - 0.05);
})()`;

// relation captions keep off heads, chips, the card and each other
const CAPTIONS_CLEAR = `(() => { ${EFF} ${BOX} ${HEADS}
  const caps = [...svg.querySelectorAll('[data-node]')].filter(e => /^cap\\d+$/.test(e.getAttribute('data-node')) && eff(e) > 0.5).map(e => bx(e.querySelector('path')));
  const others = [...svg.querySelectorAll('[data-node]')].filter(e => /^(lab\\d+-body|card|token)$/.test(e.getAttribute('data-node')) && eff(e) > 0.05).map(bx);
  return caps.every((c, i) => heads.every(h => !hit(c, h, 1)) && others.every(o => !hit(c, o, 1)) && caps.every((d, j) => j === i || !hit(c, d, 1)));
})()`;
// plain relations: solid line with end dots and no arrowhead; every connector line is solid (draw-on dash >= length)
const KINDS_DRAWN = `(() => {
  const conns = [...svg.querySelectorAll('[data-node]')].filter(e => /^rel\\d+$/.test(e.getAttribute('data-node')));
  if (!conns.length) return false;
  for (const c of conns) {
    const line = c.querySelector('[data-node$="-line"]'); const L = line.getTotalLength();
    const d = (line.getAttribute('stroke-dasharray') || '').split(/[ ,]+/).map(Number);
    if (d.length && d[0] > 0 && d[0] < L - 1) return false;
  }
  return !svg.querySelector('[marker-end], marker');
})()`;


// review 1: at most one lamp lit at any time, and a lit lamp is always the token holder's (the holder's lamp goes out
// once the token leaves the hand; the receiver's lights once it has arrived)
const ONE_LAMP = "s.lit <= 1 && (s.lamps[1] <= 0.5 || s.holder === s.receiver) && (s.lamps[0] <= 0.5 || s.holder !== s.receiver)";
// review 1: the tracer never lies over a text (any text it overlaps is drawn above it, on an opaque chip or card)
const TRACER_UNDER_TEXT = `(() => { ${EFF}
  const tr = svg.querySelector('[data-node="tracer"]'); if (eff(tr) < 0.05) return true;
  const b = tr.getBoundingClientRect();
  const texts = [...svg.querySelectorAll('text')].filter(t => eff(t) >= 0.05 && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
  return texts.every(t => { const q = t.getBoundingClientRect(); const over = q.left < b.right && b.left < q.right && q.top < b.bottom && b.top < q.bottom; return !over || (tr.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING); });
})()`;
// review 1: with labels hidden the sequence card is still drawn (party glyphs and chevrons, no text) so the sequence
// links and the tracer start from something visible
const CARD_DRAWN = `(() => { ${EFF} const c = svg.querySelector('[data-node="card"]'); return !!c && eff(c) > 0.9 && c.getBoundingClientRect().width > 20; })()`;

ratioChecks(ID, 'cards off faces, people large, captions clear, connectors solid, text floors', [
  {at: times(0, 1, 0.05), dom: NO_CARD_ON_FACE, label: 'rendered: no card, chip or panel item covers a head'},
  {at: [0, 0.5, 1], dom: PEOPLE_SIZE, label: 'rendered: people >= 60 px across and heads >= 26 px (1080p)'},
  {at: [0.45, 0.75, 1], tv: ['all'], dom: CAPTIONS_CLEAR, label: 'rendered: relation captions keep off heads, chips, the card, the token and each other'},
  {at: [0.5, 1], dom: KINDS_DRAWN, label: 'rendered: connectors are solid lines (no dashes); no arrow markers'},
  {at: [1], dom: FILL, label: 'rendered: diagram, building and panel fill the caption-safe box'},
  {at: [0, 0.5, 1], dom: IN_FRAME, label: 'rendered: nothing leaves the frame'},
  {at: times(0, 1, 0.1), dom: OPAQUE, label: 'rendered: people are always whole and opaque'},
  {at: times(0.44, 0.74, 0.02), fn: 's.allReached', label: 'hands within reach through the pass'},
  {at: times(0, 1, 0.005), fn: ONE_LAMP, label: 'at most one lamp lit at any u, and a lit lamp is the token holder\u2019s'},
  {at: times(0.43, 0.76, 0.005), dom: TRACER_UNDER_TEXT, label: 'rendered: the tracer never lies over a text'},
  {at: [0.2, 0.5, 1], tv: ['none'], dom: CARD_DRAWN, label: 'rendered: labels hidden — the sequence card is drawn (glyphs, no text)'},
  {at: [0.1, 0.5, 1], tv: ['all'], presets: ['baseline-illustrative', 'baseline-es'], dom: TEXT_195, label: 'rendered: baseline and baseline-es: every visible text >= 19.5 px in every ratio'},
  {at: [1], fn: 's.problems.length === 0 && s.connectorsLanded', label: 'no fallback; every connector lands on its element'},
]);

// review 1: the focus element enlarges ON SCREEN (rendered size) while the tracer is on it, for every focus element,
// and not outside the trace (every preset × every focus id, 16:9)
test(`${ID}: the focus element enlarges on screen while the tracer passes`, async ({page}) => {
  test.setTimeout(180000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const bad = await page.evaluate(async ([id, ps]) => {
    const def = await window.__lib.load(id);
    const out = [];
    const nodeOf = {signal: 'token-scale', lamps: 'lampw0', holder: 'p0', receiver: 'p1', sequence: 'card', room: 'bld'};
    for (const pr of ps) for (const focus of ['signal', 'lamps', 'holder', 'receiver', 'sequence']) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: 1920, height: 1080, params: {...pr.params, focusElement: focus}});
      await x.ready;
      const svg = x.element;
      const n = svg.querySelector(`[data-node="${nodeOf[focus]}"]`);
      // the rendered scale of the node (screen CTM relative to its parent), independent of arm poses
      const scaleNow = () => n.getScreenCTM().a / n.parentNode.getScreenCTM().a;
      x.seek(0.3 * x.durationMs);
      const base = scaleNow();
      let peak = 0, outside = 0;
      for (let u = 0.2; u <= 1.0001; u += 0.005) {
        x.seek(u * x.durationMs);
        const s = x.getState({bounds: false}).semantic;
        const g0 = scaleNow() / base;
        if (s.tracerOn) peak = Math.max(peak, g0); else outside = Math.max(outside, g0);
      }
      if (peak < 1.3) out.push(`${pr.name} focus=${focus}: rendered growth ${peak.toFixed(2)}`);
      if (outside > 1.005) out.push(`${pr.name} focus=${focus}: enlarged outside the trace (${outside.toFixed(2)})`);
      x.destroy(); el.remove();
    }
    return out;
  }, [ID, [{name: 'default', params: {}}, ...presetsFor(ID)]]);
  expect(bad, bad.join('\n')).toEqual([]);
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
              const pxs = parseFloat(getComputedStyle(t).fontSize) * (t.getScreenCTM().a / s0) * 1080 / Math.min(w, h);
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
// institutions. This scene has no link field; relationships are between the scene's own parts (plain relations or a sequence as configured), never between institutions.
test(`${ID}: no shipped preset or default supplies a directed link between institutions`, async () => {
  const def = (await import('../../src/animations/courts/LAW-0222.js')).default;
  const bad = [];
  const walk = (o, path) => {
    if (Array.isArray(o)) o.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (k === 'kind' && !['relation', 'sequence'].includes(v)) bad.push(`${path}.kind=${v}`); walk(v, `${path}.${k}`); }
  };
  for (const pr of [{name: 'default', params: def.defaultParams}, ...presetsFor(ID)]) {
    walk(pr.params, pr.name);
    (pr.params.relationships ?? def.defaultParams.relationships).forEach((q, i) => { if (!['relation', 'sequence'].includes(q.kind)) bad.push(`${pr.name} relationships[${i}].kind=${q.kind}`); });
  }
  expect(bad).toEqual([]);
});
