// LAW-0515 — Orden de documentos · contrast (two identical tiered letter trays; only the supplied position of one annex
// in the order list differs — listed first in A, configured lower in B — so its folder slides into a different tier).
// Contract battery + ID-specific checks.
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// definitions and the clause text (only the clause heading is drawn, once, in the shared strip); clauses = the supplied
// order-of-documents clause heading, schedules = the annexes, priorities = the shared order of the other annexes,
// changedAnnex + scenarioA/B.position = the changed fact; scenarioA, scenarioB, changedFact, sharedFacts and
// comparisonLabels are exposed.
// acceptanceCheck (brief): both scenes exist (two stages, every ratio), exactly the indicated fact changes (only the
// changed annex's slot differs between A and B; the shared annexes keep the same relative order) and no legal
// consequence is invented (bannedWords; neutral note; equal stage art). A and B are identical before the change beat
// (identicalBeforeChange at 0.30, labels on/off).
// Windows (LAW-0515.js): loupe 0.15–0.28 · change 0.30–0.40 · loupe away 0.40–0.50 · folders 0.42–0.70 (n slices,
// same timing in A and B) · guide 0.70–0.77.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0515';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['folderA', 'folderB'],
  semantic: [
    {at: 0, fn: "s.identical && s.changed === 0 && s.seatedA === 0 && s.guideShown === 0", label: 'rest: the two stages are identical'},
    {at: 0.25, fn: "s.identical && s.changed === 0", label: 'still identical while the loupe reads the waiting chip'},
    {at: 0.45, fn: "s.changed === 1 && s.tierA === 0 && s.tierB === 2 && !s.identical", label: 'after the change beat: listed first in A, third in B'},
    {at: 1, fn: "s.seatedA === 3 && s.seatedB === 3 && s.tierA === 0 && s.tierB === 2 && s.dyChanged > 50 && s.guideShown === 1 && s.layoutOk", label: 'hold: the changed folder sits in a different tier; guide shown'},
    {at: 1, fn: "JSON.stringify(s.orderA.filter(i => i !== s.changedAnnex)) === JSON.stringify(s.orderB.filter(i => i !== s.changedAnnex))", label: 'exactly one fact changes: the other annexes keep the same relative order'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.tierA === 0 && s.tierB === 1 && s.changedAnnex === 3 && s.seatedA === 4", label: 'alternative: Annex D first in A, second in B'},
    {at: 1, params: P('long-labels-stress'), fn: "s.tierA === 0 && s.tierB === 3 && s.layoutOk", label: 'stress: position 1 vs 4, layout fits'},
    {at: 1, params: {actionProgress: 0.5}, fn: "s.guideShown === 0 && s.seatedA < 3", label: 'actionProgress freezes the comparison part-way'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.tierA === 0 && s.tierB === 2 && s.seatedB === 3", label: 'labels hidden: the same difference'},
  ],
});

identicalBeforeChange(ID, 0.3);

ratioChecks(ID, 'layout fits; side by side on wide frames, stacked on tall', [
  {at: [0, 1], fn: 's.layoutOk', label: 'layout fits'},
  {at: [0], fn: 's.side === true', ratios: ['16:9', '1:1'], label: 'wide frames: side by side'},
  {at: [0], fn: 's.side === false', ratios: ['9:16'], label: 'tall frames: stacked'},
  {at: [1], fn: 's.dyChanged > 40', label: 'the one difference is a visible change of tier'},
  {at: [0, 1], fn: 's.lookA.loupeO === 0 && s.lookB.loupeO === 0', label: 'no loupe parked over the scene at rest or in the hold'},
]);

// equal weight: the two stages are drawn with identical art (same paths, fills and strokes) apart from the header
test(`${ID}: equal weight — A and B stages have identical drawn parts (rendered, every ratio)`, async ({page}) => {
  await openHost(page);
  const out = await page.evaluate(async ([ratios]) => {
    const def = await window.__lib.load('LAW-0515');
    const bad = [];
    const sig = el => [...el.querySelectorAll('path,rect')].map(e => [e.tagName, e.getAttribute('fill'), e.getAttribute('stroke'), e.getAttribute('stroke-width'), e.getAttribute('d'), e.getAttribute('width'), e.getAttribute('height'), e.getAttribute('y')].join('|')).join(';');
    for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h});
      await x.ready;
      x.seek(0);
      const a = x.element.querySelector('[data-node="A-stage"]'), b = x.element.querySelector('[data-node="B-stage"]');
      if (!a || !b) bad.push(`${ratio}: stage missing`);
      else if (sig(a) !== sig(b)) bad.push(`${ratio}: stage art differs`);
      x.destroy();
      el.remove();
    }
    return bad;
  }, [RATIOS]);
  expect(out).toEqual([]);
});

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference, p.clause.heading, ...p.schedules.map(s => s.label), p.scenarioA.label, p.scenarioB.label, p.changedFact, p.sharedFacts, p.comparisonLabels.legend]",
  content: "return [...p.schedules.map(s => s.label), p.scenarioA.label, p.scenarioB.label]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
seekHistory(ID);
fill(ID, [0.05, 1]);
bannedWords(ID);
coldCreate(ID);
arrayCounts(ID, [
  {schedules: [{tab: 'A', label: 'Annex A'}, {tab: 'B', label: 'Annex B'}], priorities: [1], changedAnnex: 2, scenarioB: {label: 'B', position: 2}},
  {priorities: [1]},
  {schedules: [{tab: 'A', label: 'Annex A · One'}, {tab: 'B', label: 'Annex B · Two'}, {tab: 'C', label: 'Annex C · Three'}, {tab: 'D', label: 'Annex D · Four'}], priorities: [4, 3, 2, 1], changedAnnex: 1, scenarioB: {label: 'B', position: 4}},
  {changedAnnex: 3, scenarioA: {label: 'A', position: 2}},
]);

// ---- Rendered checks for contract-terms-09 (kept in this file: per-motif test files may not import another
// motif's helpers; generic infrastructure adapted from tests/animations/ct05-rendered.js, copied, not imported).
const RATIOS = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];
const BIG = ['default', 'baseline-illustrative', 'baseline-es', 'contrast-or-alternative'];
async function openHost(page) {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
}
const allPresets = id => [{name: 'default', params: {}}, {name: 'default-es', params: {locale: 'es'}}, ...presetsFor(id)];

/** Visible text never under the floor (19.5 px baseline presets, 16 px stress) at any u step of 0.01 (rendered). */
function textFloor(ID) {
  test(`${ID}: every visible text stays at or above the text floor at every moment (u step 0.01, rendered)`, async ({page}) => {
    test.setTimeout(900000);
    await openHost(page);
    const out = await page.evaluate(async ([id, presets, ratios, big]) => {
      const def = await window.__lib.load(id);
      const fails = [];
      let checked = 0;
      for (const pr of presets) for (const tv of ['all', 'key']) for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const svg = x.element;
        const k = 1080 / Math.min(w, h);
        const floor = big.includes(pr.name) || pr.name === 'default-es' ? 19.5 : 16;
        const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && !t.closest('[data-layer="content-notice"]'));
        for (let s = 0; s <= 100; s++) {
          x.seek((s / 100) * x.durationMs);
          const rootM = svg.getScreenCTM().inverse();
          for (const t of texts) {
            let op = 1, hidden = false;
            for (let n = t; n && n !== svg; n = n.parentNode) {
              const a = n.getAttribute('opacity');
              if (a !== null) op *= parseFloat(a);
              if (n.getAttribute('display') === 'none') hidden = true;
            }
            if (hidden || op < 0.02) continue;
            const m = rootM.multiply(t.getScreenCTM());
            const px = parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * k;
            checked++;
            if (px < floor - 0.05) fails.push(`${pr.name} ${tv} ${ratio} u${(s / 100).toFixed(2)} "${t.textContent.trim().slice(0, 24)}" ${px.toFixed(1)}px < ${floor}`);
          }
        }
        x.destroy();
        el.remove();
      }
      return {fails, checked};
    }, [ID, allPresets(ID), RATIOS, BIG]);
    expect(out.checked).toBeGreaterThan(1000);
    const seen = new Set();
    const uniq = out.fails.filter(f => { const key = f.replace(/ u[0-9.]+ /, ' '); if (seen.has(key)) return false; seen.add(key); return true; });
    expect(uniq.slice(0, 20), `${out.fails.length} small-text samples`).toEqual([]);
  });
}

/** No visible text over another visible text at any u step of 0.01 (rendered; opaque [data-occludes] overlays respected). */
function noTextOverlap(ID) {
  test(`${ID}: no text is drawn over another text at any moment (u step 0.01, rendered)`, async ({page}) => {
    test.setTimeout(900000);
    await openHost(page);
    const out = await page.evaluate(async ([id, presets, ratios]) => {
      const def = await window.__lib.load(id);
      const fails = [];
      let checked = 0;
      for (const pr of presets) for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        const svg = x.element;
        const k = 1080 / Math.min(w, h);
        const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && !t.closest('[data-layer="content-notice"]'));
        const occluders = [...svg.querySelectorAll('[data-occludes]')];
        const op = n0 => { let o = 1; for (let n = n0; n && n !== svg; n = n.parentNode) { const a = n.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (n.getAttribute('display') === 'none') return 0; } return o; };
        for (let s = 0; s <= 100; s++) {
          x.seek((s / 100) * x.durationMs);
          const occ = occluders.filter(q => op(q) > 0.5).map(q => ({q, b: q.getBoundingClientRect()}));
          const vis = [];
          for (const t of texts) {
            if (op(t) < 0.05) continue;
            const b = t.getBoundingClientRect();
            if (!b.width || !b.height) continue;
            const covered = occ.some(({q, b: c}) => !q.contains(t) && (t.compareDocumentPosition(q) & Node.DOCUMENT_POSITION_FOLLOWING)
              && Math.max(0, Math.min(b.right, c.right) - Math.max(b.left, c.left)) * Math.max(0, Math.min(b.bottom, c.bottom) - Math.max(b.top, c.top)) > 0.6 * b.width * b.height);
            if (!covered) vis.push({t, b});
          }
          for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
            const a = vis[i].b, c = vis[j].b;
            const ox = Math.min(a.right, c.right) - Math.max(a.left, c.left), oy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
            checked++;
            if (!(ox * k > 3 && oy > 0.25 * Math.min(a.height, c.height))) continue;
            fails.push(`${pr.name} ${ratio} u${(s / 100).toFixed(2)} "${vis[i].t.textContent.trim().slice(0, 18)}" × "${vis[j].t.textContent.trim().slice(0, 18)}"`);
          }
        }
        x.destroy();
        el.remove();
      }
      return {fails, checked};
    }, [ID, allPresets(ID), RATIOS]);
    expect(out.checked).toBeGreaterThan(1000);
    const seen = new Set();
    const uniq = out.fails.filter(f => { const key = f.replace(/ u[0-9.]+ /, ' '); if (seen.has(key)) return false; seen.add(key); return true; });
    expect(uniq.slice(0, 20), `${out.fails.length} overlapping text samples`).toEqual([]);
  });
}

/** Seek history: 60 fps playback and backward seeks give the same SVG as a fresh seek. */
function seekHistory(ID) {
  test(`${ID}: the render does not depend on seek history (60 fps playback and backward seeks vs fresh seek)`, async ({page}) => {
    test.setTimeout(900000);
    await openHost(page);
    const out = await page.evaluate(async ([id, presets, ratios]) => {
      const def = await window.__lib.load(id);
      const fails = [];
      let compared = 0;
      const snap = svg => [...svg.querySelectorAll('*')].map(e => `${e.tagName}|${[...e.attributes].map(a => `${a.name}=${a.value}`).join(' ')}`.replace(/law-anim-[0-9]+-/g, 'law-anim-#-'));
      const make = async (w, h, params) => { const el = document.createElement('div'); document.getElementById('slots').appendChild(el); const x = def.create(el, {width: w, height: h, params}); await x.ready; return {x, el}; };
      for (const pr of presets) for (const [ratio, w, h] of ratios) {
        const played = await make(w, h, pr.params);
        const fresh = await make(w, h, pr.params);
        const D = played.x.durationMs;
        const cmp = (label, u) => {
          fresh.x.seek(u * D);
          const a = snap(played.x.element), b = snap(fresh.x.element);
          compared++;
          if (a.length !== b.length) { fails.push(`${pr.name} ${ratio} ${label} u${u}: node count ${a.length} vs ${b.length}`); return; }
          const diff = a.map((v, i) => (v === b[i] ? null : i)).filter(i => i !== null);
          if (diff.length) fails.push(`${pr.name} ${ratio} ${label} u${u}: ${diff.length} nodes differ, e.g. ${a[diff[0]].slice(0, 120)} ≠ ${b[diff[0]].slice(0, 120)}`);
        };
        const marks = [0.45, 0.6, 0.8, 1];
        let mi = 0;
        for (let t = 0; t <= D + 1e-6; t += 1000 / 60) {
          played.x.seek(t);
          while (mi < marks.length && t / D >= marks[mi] - 1e-9) { played.x.seek(marks[mi] * D); cmp('forward', marks[mi]); played.x.seek(t); mi++; }
        }
        played.x.seek(D);
        cmp('end', 1);
        for (const u of [0.8, 0.6, 0.45, 0.1, 0.6, 1, 0.45]) { played.x.seek(u * D); cmp('backward', u); }
        for (const q of [played, fresh]) { q.x.destroy(); q.el.remove(); }
      }
      return {fails, compared};
    }, [ID, presetsFor(ID).map(q => ({name: q.name, params: q.params})).concat([{name: 'default', params: {}}]), RATIOS]);
    expect(out.compared).toBeGreaterThan(100);
    expect(out.fails.slice(0, 20), `${out.fails.length} seek-history differences`).toEqual([]);
  });
}

/**
 * Fill: at the given u values, labels all / key / none, the visible scene spans ≥ 90 % of the caption-safe box on its
 * long axis and ≥ `short` on the other (rendered).
 */
function fill(ID, at, short = 0.8) {
  test(`${ID}: the scene fills the caption-safe box at u ${at.join(', ')}, labels all / key / none (rendered)`, async ({page}) => {
    test.setTimeout(900000);
    await openHost(page);
    const out = await page.evaluate(async ([id, presets, ratios, at, short]) => {
      const def = await window.__lib.load(id);
      const fails = [], rows = [];
      for (const pr of presets) for (const tv of ['all', 'key', 'none']) for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const svg = x.element;
        const R = svg.getBoundingClientRect();
        const vis = e => { for (let q = e; q && q !== svg; q = q.parentElement) { const o = q.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.05) return false; } return true; };
        const st = x.getState({bounds: false}).params.safeArea;
        const safe = {w: R.width * (1 - st.left - st.right), h: R.height * (1 - st.top - st.bottom) - Math.min(R.width, R.height) * 0.057};
        for (const u of at) {
          x.seek(u * x.durationMs);
          const bs = [...svg.querySelectorAll('[data-layer="scene"] path, [data-layer="scene"] rect, [data-layer="scene"] text, [data-layer="scene"] circle, [data-layer="scene"] line')]
            .filter(e => !e.closest('defs') && !e.closest('clipPath') && vis(e)).map(e => e.getBoundingClientRect()).filter(q => q.width > 0 || q.height > 0);
          const x0 = Math.min(...bs.map(q => q.left)), x1 = Math.max(...bs.map(q => q.right)), y0 = Math.min(...bs.map(q => q.top)), y1 = Math.max(...bs.map(q => q.bottom));
          const fw = (x1 - x0) / safe.w, fh = (y1 - y0) / safe.h;
          rows.push(`${pr.name} ${tv} ${ratio} u${u} fw ${fw.toFixed(2)} fh ${fh.toFixed(2)}`);
          if (!(Math.max(fw, fh) >= 0.9 && Math.min(fw, fh) >= short)) fails.push(`${pr.name} ${tv} ${ratio} u${u}: fw ${fw.toFixed(2)} fh ${fh.toFixed(2)}`);
        }
        x.destroy();
        el.remove();
      }
      return {fails, rows};
    }, [ID, presetsFor(ID).map(q => ({name: q.name, params: q.params})).concat([{name: 'default', params: {}}]), RATIOS, at, short]);
    expect(out.fails.slice(0, 20), `${out.fails.length} under-filled frames`).toEqual([]);
  });
}

// Banned wording (order of documents): no rendered text, EN or ES, may state interpretation doctrine or a conclusion —
// that a document prevails, governs, overrides or wins, a conflict rule, validity, an obligation, an outcome — nor
// name a jurisdiction. Positions and "priority"/"subordinate" appear only as supplied values.
const BANNED = /(\bprevail|prevalec|prevalen|\bgovern|\brige\b|\brigen\b|regir|\boverrid|supersed|\bprima sobre|\bwins?\b|\bloses?\b|\bgana\b|\bpierde\b|\bconflict|conflicto|contradic|\binterpret|interpreta|\bconstru(e|ction)\b|\bcontra proferentem|\bliab|responsab|\bobligat|\bobliged|obligad|\bobligaci|\bmust\b|\bshall\b|\bdebe|\bdeber|tiene que|\bvalid|\binvalid|v(á|a)lid[oa]s?\b|validez|nulidad|enforce|exigib|binding|vinculant|breach|incumpl|\bentitled|\boutcome|\bresult\b|resultado|consequen|consecuencia|\blaw\b|\bley\b|statut|c(ó|o)digo|\bguilt|culpab|\bdecided|decidid|\bruling|\bverdict|fallo\b|sentencia|\bplazo|deadline|percent|porcentaje|\bvoid\b|\bnulo\b)/i;
function bannedWords(ID) {
  test(`${ID}: no rendered text states interpretation doctrine or a conclusion (EN and ES, every preset, rendered)`, async ({page}) => {
    test.setTimeout(600000);
    await openHost(page);
    const out = await page.evaluate(async ([id, presets, ratios, src]) => {
      const def = await window.__lib.load(id);
      const banned = new RegExp(src, 'i');
      const bad = [];
      let n = 0;
      for (const pr of presets) for (const [ratio, w, h] of ratios) for (const tv of ['all', 'key']) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        for (let s = 0; s <= 20; s++) {
          x.seek((s / 20) * x.durationMs);
          for (const t of x.element.querySelectorAll('text')) {
            if (t.closest('[data-layer="content-notice"]')) continue;
            const ts = [...t.querySelectorAll('tspan')];
            const q = (ts.length ? ts.map(z => z.textContent).join(' ') : t.textContent).replace(/\s+/g, ' ').trim();
            if (!q) continue;
            n++;
            if (banned.test(q)) bad.push(`${pr.name} ${ratio} "${q.slice(0, 50)}"`);
          }
        }
        x.destroy();
        el.remove();
      }
      return {bad: [...new Set(bad)], n};
    }, [ID, allPresets(ID), RATIOS, BANNED.source]);
    expect(out.n).toBeGreaterThan(100);
    expect(out.bad.slice(0, 20)).toEqual([]);
  });
  test(`${ID}: no preset supplies doctrine wording; no jurisdiction named (EN and ES)`, () => {
    const juris = /(english|england|anglo|common[- ]law|civil[- ]law|british|american|ingl[eé]s|inglaterra|anglosaj|brit[aá]nic|estadounidense|jurisdic)/i;
    for (const pr of presetsFor(ID)) {
      const s = JSON.stringify(pr.params);
      expect(s.match(BANNED), pr.name).toBeNull();
      expect(s.match(juris), pr.name).toBeNull();
    }
  });
}

/** Cold create() ≤ 900 ms in a fresh page for every preset × ratio (module-level caches don't count). */
function coldCreate(ID) {
  test(`${ID}: cold create() stays under 900 ms in every preset × ratio (fresh page each)`, async ({browser}) => {
    test.setTimeout(600000);
    const slow = [];
    for (const pr of presetsFor(ID)) for (const [ratio, w, h] of RATIOS) {
      const page = await browser.newPage();
      await openHost(page);
      const ms = await page.evaluate(async ([id, params, w, h]) => {
        const def = await window.__lib.load(id);
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const t0 = performance.now();
        const x = def.create(el, {width: w, height: h, params});
        await x.ready;
        x.seek(x.durationMs);
        return performance.now() - t0;
      }, [ID, pr.params, w, h]);
      if (ms > 900) slow.push(`${pr.name} ${ratio} ${ms.toFixed(0)} ms`);
      await page.close();
    }
    expect(slow).toEqual([]);
  });
}

/** Every array length 1..max at every ratio renders a laid-out scene (no 'no-layout-fits'). */
function arrayCounts(ID, variants) {
  test(`${ID}: every array count renders a laid-out scene at 16:9 / 9:16 / 1:1`, async ({page}) => {
    test.setTimeout(300000);
    await openHost(page);
    const out = await page.evaluate(async ([id, variants, ratios]) => {
      const def = await window.__lib.load(id);
      const bad = [];
      for (const v of variants) for (const [ratio, w, h] of ratios) {
        const e = def.evaluate({width: w, height: h, params: v, timeMs: 6000});
        if (!e.semantic.layoutOk) bad.push(`${JSON.stringify(v).slice(0, 80)} ${ratio}: ${e.semantic.why}`);
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: v});
        await x.ready;
        x.seek(x.durationMs);
        if (x.element.querySelectorAll('path').length < 20) bad.push(`${ratio}: empty scene`);
        x.destroy();
        el.remove();
      }
      return bad;
    }, [ID, variants, RATIOS]);
    expect(out).toEqual([]);
  });
}
// ---- end of rendered checks
