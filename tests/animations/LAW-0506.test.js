// LAW-0506 — Cláusula de indemnidad · mechanism (an exploded assembly of layers: contract plate, clause plate and a
// promise film stack, the film registers on the supplied promise line, the claim plugs into its socket and a scope
// collar slides over the joint). Contract battery + ID-specific checks.
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// schedules, definitions, priorities, actorLabels (no actor in this treatment) and annotations; objectLabels = the
// component name tabs (elements).
// acceptanceCheck (brief): continuity of the motion (60 fps: the tracer, the plates, the slip), anchored objects (the
// film lands exactly on the promise line; the prong seats in the socket) and a transformation recognisable with the
// labels hidden (exploded → stacked → plugged → collar). Relations are drawn only as supplied (plain lines unless a
// sequence / causal kind is supplied). Legal content: no indemnity doctrine (bannedWords), no jurisdiction; "scope
// disputed" is neutral (same collar colour and width, dashed; ◆ of the same area as ●).
// Windows (LAW-0506.js): explode 0.03–0.17 · tabs 0.12–0.18 · trace 0.18–0.56 · tabs out 0.56–0.60 · plates 0.60–0.72 ·
// slip 0.72–0.81 · collar 0.81–0.87 · status 0.87–0.91. A camera fit keeps the moving mechanism filling the art box.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0506';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['contract', 'clause', 'promise', 'slipTip'],
  semantic: [
    {at: 0, fn: "s.spread === 0 && s.filmRegistered && !s.seated && s.collar === 0 && s.tabsShown === 0 && s.tracer === null && s.finalShown === 0", label: 'rest: the stack assembled, the claim apart'},
    {at: 0.1, fn: "s.spread > 0 && s.spread < 1 && !s.filmRegistered", label: 'the layers separate along the depth axis'},
    {at: 0.3, fn: "s.tracer !== null && s.trace > 0 && s.trace < 1 && s.spread === 1 && s.tabsShown === 1", label: 'the tracer follows the relations in the exploded view'},
    {at: 0.66, fn: "s.assembled > 0 && s.assembled < 1 && !s.seated && s.tabsShown === 0", label: 'the layers re-assemble after the trace'},
    {at: 0.75, fn: "s.filmRegistered && !s.seated && s.collar === 0", label: 'the film is registered before the claim plugs in'},
    {at: 0.84, fn: "s.seated && s.connected && s.collar > 0 && s.collar < 1", label: 'the collar slides on after the prong seats'},
    {at: 1, fn: "s.collarOn && s.collarStyle === 'solid' && s.finalState === 'covered' && s.finalShown === 1 && s.keyShown === 1 && s.layoutOk", label: 'hold: covered as supplied, solid collar, tags shown'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.finalState === 'disputed' && s.collarStyle === 'dashed' && s.collarOn && s.connected", label: 'disputed: the same collar drawn dashed — neutral'},
    {at: 1, params: P('long-labels-stress'), fn: "s.connected && s.layoutOk && s.relations === 4", label: 'stress: four relations, connected, layout fits'},
    {at: 1, params: {actionProgress: 0.5}, fn: "!s.seated && s.collar === 0", label: 'actionProgress freezes the assembly part-way'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.connected && s.collarOn", label: 'labels hidden: the same assembly'},
  ],
});

ratioChecks(ID, 'layout fits, order, arrangement per ratio', [
  {at: [0, 1], fn: 's.layoutOk', label: 'layout fits'},
  {at: [0.75], fn: 's.filmRegistered && !s.seated', label: 'registered before plugged'},
  {at: [0, 0.5, 1], fn: "s.arrangement === 'depth'", label: 'every ratio: an exploded view along a depth axis'},
  {at: [0.3], fn: "s.routeHits <= 2", label: 'relation curves do not cross supplied text (at most a sample at a tab corner)'},
  {at: [1], fn: "s.zoom > 0", label: 'camera fit defined'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title, p.clauseTitle, p.claim.label, p.stateLabels[p.finalState], ...p.clauses]",
  content: "return [p.claim.label, p.stateLabels[p.finalState], ...p.clauses]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
seekHistory(ID);
fill(ID, [0.05, 0.3, 0.5, 0.66, 0.76, 1], 0.8);
bannedWords(ID);
coldCreate(ID);
arrayCounts(ID, [
  {clauses: ['Clause 1 (supplied text)'], promise: 1},
  {clauses: ['Clause 1 (supplied text)', 'Clause 2 (supplied text)'], promise: 2},
  {relationships: [{from: 'claim', to: 'promise', kind: 'causal'}], traversalOrder: ['claim', 'contract']},
  {relationships: [{from: 'contract', to: 'clause', kind: 'relation'}, {from: 'clause', to: 'promise', kind: 'sequence'}, {from: 'promise', to: 'claim', kind: 'communication'}, {from: 'contract', to: 'claim', kind: 'causal'}, {from: 'clause', to: 'claim', kind: 'relation'}, {from: 'contract', to: 'promise', kind: 'relation'}]},
]);

// the tab names (elements) are drawn in the exploded view (they fade out once the layers assemble)
test(`${ID}: every component name tab is drawn at rest (rendered, every preset × ratio)`, async ({page}) => {
  await openHost(page);
  const out = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const bad = [];
    for (const pr of presets) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      x.seek(0);
      const texts = [...x.element.querySelectorAll('text')].map(t => t.textContent.replace(/\s+/g, ' ').trim());
      for (const e of x.getState({bounds: false}).params.elements) if (!texts.some(t => t === e.label)) bad.push(`${pr.name} ${ratio}: tab "${e.label}" missing`);
      x.destroy();
      el.remove();
    }
    return bad;
  }, [ID, presetsFor(ID).filter(q => q.name !== 'baseline-es'), RATIOS]);
  expect(out).toEqual([]);
});

// ---- Rendered checks for contract-terms-07 (kept in this file: per-motif test files may not import another
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

// Banned wording (very high legal risk: indemnity). No rendered text, EN or ES, may state indemnity doctrine or a
// conclusion: a duty to indemnify / pay / compensate, liability, hold harmless, an obligation, must / shall, valid,
// enforceable, binding, breach, outcome, entitled … The motif's own clause heading ("Indemnity clause" / "Cláusula de
// indemnidad") is the only allowed "indemn-" text, and the cover words (cover / covered / coverage, cubierta /
// cobertura) may appear only inside texts that are exactly a supplied parameter value.
const BANNED = /(indemnif|indemniz|\bindemnity\b(?! clause)|hold harmless|mantener indemne|\bliab|responsab|\bobligat|\bobliged|obligad|\bobligaci|\bmust\b|\bshall\b|\bdebe|\bdeber|tiene que|\bpay(s|able|ment)?\b|\bpaid\b|pagar|pago\b|\bpagad|compensat|compens|reimburs|reembols|\bowe|\bowed|adeud|\bvalid|\binvalid|v(á|a)lid[oa]s?\b|validez|nulidad|enforce|exigib|ejecutab|binding|vinculant|breach|incumpl|\bentitled|tiene derecho|derecho a\b|\bright to\b|\boutcome|\bresult\b|resultado|consequen|consecuencia|\bwins?\b|\bloses?\b|gana|pierde|\blaw\b|\bley\b|statut|c(ó|o)digo|damages|\bdaños|perjuicio|\bguilt|culpab|\bfault|\bnegligen|\bproven\b|probad[oa]|\bdecided|decidid|\bruling|\bverdict|fallo\b|sentencia|\bplazo|deadline|\bdays?\b|\bd(í|i)as?\b|percent|porcentaje|\bcap\b|l(í|i)mite de)/i;
const COVER = /(\bcover|cubiert|cobertura)/i;
function bannedWords(ID) {
  test(`${ID}: no rendered text states indemnity doctrine or a conclusion; cover words only inside supplied values (EN and ES, every preset, rendered)`, async ({page}) => {
    test.setTimeout(600000);
    await openHost(page);
    const out = await page.evaluate(async ([id, presets, ratios, src, csrc]) => {
      const def = await window.__lib.load(id);
      const banned = new RegExp(src, 'i'), cover = new RegExp(csrc, 'i');
      const bad = [];
      let n = 0;
      const vals = o => (o && typeof o === 'object' ? Object.values(o).flatMap(vals) : typeof o === 'string' ? [o] : []);
      for (const pr of presets) for (const [ratio, w, h] of ratios) for (const tv of ['all', 'key']) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const supplied = new Set(vals(x.getState({bounds: false}).params).map(s => s.replace(/\s+/g, ' ').trim()));
        for (let s = 0; s <= 20; s++) {
          x.seek((s / 20) * x.durationMs);
          for (const t of x.element.querySelectorAll('text')) {
            if (t.closest('[data-layer="content-notice"]')) continue;
            const ts = [...t.querySelectorAll('tspan')];
            const q = (ts.length ? ts.map(z => z.textContent).join(' ') : t.textContent).replace(/\s+/g, ' ').trim();
            if (!q) continue;
            n++;
            if (banned.test(q.replace(/Cláusula de indemnidad/g, ''))) bad.push(`${pr.name} ${ratio} "${q.slice(0, 50)}"`);
            if (cover.test(q) && ![...supplied].some(v => v === q || q.endsWith(v) || q.startsWith(v))) bad.push(`${pr.name} ${ratio} cover word outside a supplied value: "${q.slice(0, 50)}"`);
          }
        }
        x.destroy();
        el.remove();
      }
      return {bad: [...new Set(bad)], n};
    }, [ID, allPresets(ID), RATIOS, BANNED.source, COVER.source]);
    expect(out.n).toBeGreaterThan(100);
    expect(out.bad.slice(0, 20)).toEqual([]);
  });
  test(`${ID}: no preset supplies indemnity-doctrine wording; no jurisdiction named (EN and ES)`, () => {
    const juris = /(english|england|anglo|common[- ]law|civil[- ]law|british|american|ingl[eé]s|inglaterra|anglosaj|brit[aá]nic|estadounidense|jurisdic)/i;
    for (const pr of presetsFor(ID)) {
      const s = JSON.stringify(pr.params).replace(/Indemnity clause|Cláusula de indemnidad|indemnity clause/g, '');
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
