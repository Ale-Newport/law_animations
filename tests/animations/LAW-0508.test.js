// LAW-0508 — Cláusula de indemnidad · inspect (a reading stand: the claim slip is connected to the promise socket; a
// detail lens isolates the scope tag hanging from it and one supplied status is substituted). Contract battery +
// ID-specific checks (lens patterns after tests/animations/LAW-0500.test.js, LAW-0148/0164).
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// schedules, definitions, priorities, actorLabels (no actor) and annotations; objectLabels = contextLabels.
// acceptanceCheck (brief): continuity (60 fps: the reading lens), the lens is a real enlargement (≥ 1.5×, its smaller
// side ≥ 35 % of the frame's short side), the datum is legible in one place at a time (context copy blanked while the
// lens shows it), only the dependent geometry follows (the outline edge solid ↔ dashed), the old value stays traceable
// ("was: …"), the context returns with the changed-datum marker, and seeking back restores the before-value. Labels
// hidden: same sequence. Legal content: no indemnity doctrine (bannedWords), no jurisdiction; equal weight (● / ◆).
// Windows (LAW-0508.js): reading lens in 0.10–0.20 · open 0.20–0.32 · lift 0.42–0.49 · was 0.47–0.52 · after 0.50–0.56 ·
// edge 0.56–0.64 · close 0.68–0.78 · reading lens out 0.74–0.82 · marker 0.80–0.84 · key 0.82–0.88 · label 0.84–0.90.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0508';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['lensCentre', 'lupaGrip'],
  semantic: [
    {at: 0, fn: "s.value === 'before' && s.lensOpen === 0 && s.markerShown === 0 && s.contextDatum === 1 && s.outline === 'covered'", label: 'context: before-value, solid outline'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.copyShown === 1 && s.contextDatum === 0 && s.value === 'before'", label: 'lens open: the datum shown in the lens only'},
    {at: 0.6, fn: "s.value === 'after' && s.lensOpen === 1 && s.outline === 'changing' && s.wasShown === 1", label: 'substituted in the lens, old value traceable; the outline edge follows'},
    {at: 1, fn: "s.value === 'after' && s.outline === 'disputed' && s.lensOpen === 0 && s.markerShown === 1 && s.contextDatum === 1 && s.keyShown === 1 && s.layoutOk && s.lupaParked", label: 'back to context with the changed marker'},
    {at: 0.1, fn: "s.value === 'before' && s.markerShown === 0 && s.outline === 'covered'", label: 'seeking back restores the before-value'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.value === 'after' && s.outline === 'covered'", label: 'reverse substitution: the outline becomes solid'},
    {at: 0.5, fn: "s.outline === 'covered' && s.value !== 'after'", label: 'the outline changes only after the substitution'},
    {at: 0.3, fn: "s.lensOpen > 0 && s.lensOpen < 1 && !(s.copyShown >= 0.15 && s.contextDatum >= 0.15)", label: 'opening: never two legible copies'},
    {at: 1, params: {actionProgress: 0.4}, fn: "s.value !== 'after' && s.markerShown === 0", label: 'actionProgress freezes the inspection part-way'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.value === 'after'", label: 'labels hidden: same sequence'},
  ],
});

ratioChecks(ID, 'lens is a real inspection; one datum place; parked reading lens', [
  {at: [0.4, 0.6], fn: 's.zoom >= 1.5', label: 'magnification ≥ 1.5×'},
  {dom: "(() => { const r = svg.querySelector('[data-node=\"lens-border\"]').getBoundingClientRect(); const R = svg.getBoundingClientRect(); const vb = svg.viewBox.baseVal; const k = Math.min(R.width / vb.width, R.height / vb.height); return Math.min(r.width, r.height) / (k * Math.min(vb.width, vb.height)) >= 0.35; })()", at: [0.5], label: 'lens smaller side ≥ 35 % of the frame short side'},
  {at: times(0.15, 0.84, 0.01), fn: '!(s.copyShown >= 0.15 && s.contextDatum >= 0.15)', label: 'never two legible copies of the datum'},
  {at: [1], fn: 's.layoutOk', label: 'layout fits'},
  // (AUTHORING item 12: the parked reading lens is clear of the tag)
  {at: [1], fn: 's.lupaBox.x >= s.tagBox.x + s.tagBox.w || s.lupaBox.x + s.lupaBox.w <= s.tagBox.x || s.lupaBox.y >= s.tagBox.y + s.tagBox.h || s.lupaBox.y + s.lupaBox.h <= s.tagBox.y', label: 'the parked reading lens is clear of the tag'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title, p.clauseTitle, p.claim.label, p.afterValue, ...p.clauses, p.contextLabels.context, p.contextLabels.marker]",
  content: "return [p.claim.label, p.afterValue, ...p.clauses]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
seekHistory(ID);
fill(ID, [0.05, 1], 0.5);
bannedWords(ID);
coldCreate(ID);
arrayCounts(ID, [
  {clauses: ['Clause 1 (supplied text)'], promise: 1},
  {clauses: ['Clause 1 (supplied text)', 'Clause 2 (supplied text)'], promise: 2},
  {promise: 3},
  {promise: 1, detailGeometry: {zoom: 1.5, placement: 'bottom'}},
]);

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
