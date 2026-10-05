// Rendered-DOM checks shared by the four "Comunicación a la contraparte" entries (LAW-0253..0256).
// Every size and share is measured on the RENDERED DOM at 1080p (getBoundingClientRect / getScreenCTM × computed
// font size), in every preset × ratio (AUTHORING items 11, 17, 19, 20; lens rules at line 109). Each test also prints
// the extreme rendered values it measured (console, prefixed "[civil-claim-04]"), so reports quote rendered numbers.
import {test, expect} from '@playwright/test';
import {presetsFor} from '../harness/contract.js';

export const RATIOS = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];
export const BASELINES = ['default', 'baseline-illustrative', 'baseline-es'];

// In-page helpers (serialised into page.evaluate): effective opacity, boxes.
export const HELPERS = `
  const eff = (svg, e) => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null && a !== undefined && a !== '') o *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return o; };
  const box = e => { const b = e.getBoundingClientRect(); return {l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height}; };
  const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;
  const texts = (svg, minOp = 0.05) => [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]') && (t.textContent || '').trim() && eff(svg, t) >= minOp && t.getBoundingClientRect().width > 0.5);
  const node = (svg, n) => svg.querySelector('[data-node="' + n + '"]');
`;

/** Run `fn` (an async body) for every preset × ratio (× labels hidden) in one page; collect its returned strings. */
export async function forAll(page, ID, fn, arg, {withHidden = false, presets: only = null} = {}) {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)].filter(q => !only || only.includes(q.name));
  return page.evaluate(async ([id, presets, ratios, src, arg, withHidden, helpers]) => {
    const def = await window.__lib.load(id);
    const body = new Function('x', 'svg', 'pr', 'ratio', 'w', 'h', 'arg', 'stat', `${helpers}; return (async () => { ${src} })();`);
    const out = [];
    const stats = {};
    const stat = (key, v, mode = 'min') => { if (!(key in stats) || (mode === 'min' ? v < stats[key] : v > stats[key])) stats[key] = v; };
    for (const pr of presets) for (const tv of withHidden ? [null, 'none'] : [null]) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const params = tv ? {...pr.params, textVisibility: tv} : pr.params;
      const x = def.create(el, {width: w, height: h, params});
      await x.ready;
      const res = await body(x, x.element, {...pr, name: pr.name + (tv ? ' (labels hidden)' : '')}, ratio, w, h, arg, stat);
      if (res && res.length) out.push(...res);
      x.destroy();
      el.remove();
    }
    return {bad: [...new Set(out)].slice(0, 40), stats};
  }, [ID, presets, RATIOS, fn, arg, withHidden, HELPERS]);
}

const report = (ID, name, stats) => console.log(`[civil-claim-04] ${ID} ${name}: ${JSON.stringify(stats)}`);

/** Every visible text >= 19.5 px (baselines) / >= 16 px (other presets) at 1080p at EVERY sampled u. */
export function textFloorTest(ID, {step = 0.01} = {}) {
  test(`${ID}: every visible text >= 19.5 px in default/baseline/baseline-es and >= 16 px elsewhere, at every u (step ${step})`, async ({page}) => {
    test.setTimeout(600000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      const base = arg.baselines.includes(pr.name);
      const floor = base ? 19.5 : 16;
      for (let u = 0; u <= 1.0001; u += arg.step) {
        x.seek(u * x.durationMs);
        const s0 = svg.getScreenCTM().a;
        for (const t of texts(svg, 0.05)) {
          const m = t.getScreenCTM();
          const pxs = parseFloat(getComputedStyle(t).fontSize) * (Math.hypot(m.a, m.b) / s0) * 1080 / Math.min(w, h);
          stat((base ? 'baseline ' : 'other ') + ratio, Math.round(pxs * 10) / 10);
          if (pxs < floor - 0.05) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': "' + t.textContent.slice(0, 24) + '" ' + pxs.toFixed(1) + ' px < ' + floor);
        }
      }
      return out;`, {step, baselines: BASELINES});
    report(ID, 'min text px', stats);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/** No visible text leaves the frame at any u (and no listed element). */
export function inFrameTest(ID, {step = 0.005, clipped = []} = {}) {
  test(`${ID}: no visible text or chip extends past the frame at any u (step ${step})`, async ({page}) => {
    test.setTimeout(600000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      const F = svg.getBoundingClientRect();
      const outside = b => b.l < F.left - 0.5 || b.t < F.top - 0.5 || b.r > F.right + 0.5 || b.b > F.bottom + 0.5;
      for (let u = 0; u <= 1.0001; u += arg.step) {
        x.seek(u * x.durationMs);
        for (const t of texts(svg, 0.05)) if (outside(box(t))) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(3) + ': "' + t.textContent.slice(0, 28) + '"');
        for (const sel of arg.clipped) for (const c of svg.querySelectorAll(sel)) if (eff(svg, c) > 0.05 && outside(box(c))) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(3) + ': ' + sel + ' outside the frame');
      }
      return out;`, {step, clipped}, {withHidden: true});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Texts never overlap each other, and markers/chips/props (selectors) never lie over (drawn above) a text that is not
 * their own, at every sampled u (opacity >= 0.3). `opaque` selectors are occluding overlays.
 */
export function noOverlapTest(ID, {step = 0.01, markers = [], opaque = [], pad = 1} = {}) {
  test(`${ID}: texts never overlap, and markers/chips/props never cover a text, at every u (step ${step})`, async ({page}) => {
    test.setTimeout(600000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      for (let u = 0; u <= 1.0001; u += arg.step) {
        x.seek(u * x.durationMs);
        const occ = arg.opaque.flatMap(sel => [...svg.querySelectorAll(sel)]).filter(e => eff(svg, e) > 0.3);
        const covered = t => occ.some(o => !o.contains(t) && (() => { const a = box(t), b = box(o); return a.l >= b.l && a.r <= b.r && a.t >= b.t && a.b <= b.b; })() && (t.compareDocumentPosition(o) & Node.DOCUMENT_POSITION_FOLLOWING));
        const T = texts(svg, 0.3).filter(t => !covered(t));
        for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
          if (hit(box(T[i]), box(T[j]), arg.pad)) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': "' + T[i].textContent.slice(0, 18) + '" overlaps "' + T[j].textContent.slice(0, 18) + '"');
        }
        for (const sel of arg.markers) for (const m of svg.querySelectorAll(sel)) {
          if (eff(svg, m) < 0.3) continue;
          const mb = box(m);
          for (const t of T) if (!m.contains(t) && (m.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_PRECEDING) && hit(mb, box(t), arg.pad)) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': ' + sel + ' covers "' + t.textContent.slice(0, 18) + '"');
        }
      }
      return out;`, {step, markers, opaque, pad}, {withHidden: true});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/** create() <= 1 s COLD (a fresh page per preset × ratio). */
export function coldCreateTest(ID) {
  test(`${ID}: cold create() <= 1 s in every preset × ratio (fresh page each)`, async ({browser}) => {
    test.setTimeout(300000);
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const slow = [];
    let worst = 0;
    for (const pr of presets) for (const [ratio, w, h] of RATIOS) {
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
      worst = Math.max(worst, ms);
      if (ms > 1000) slow.push(`${pr.name} ${ratio}: ${Math.round(ms)} ms`);
      await page.close();
    }
    report(ID, 'cold create worst ms', {worst: Math.round(worst)});
    expect(slow, slow.join('\n')).toEqual([]);
  });
}

/**
 * People (data-node names; a plan person is 100 template units across the shoulders) are >= min px across (1080p) at
 * every sampled u; during [lens0, lens1] the floor is lensMin. Labels shown and hidden.
 */
export function peopleSizeTest(ID, {names, min = 60, lensMin = 45, lens = null, step = 0.05}) {
  test(`${ID}: people >= ${min} px across${lens ? ` (>= ${lensMin} px while the lens is open)` : ''} at every u (step ${step}), labels shown and hidden`, async ({page}) => {
    test.setTimeout(600000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      for (let u = 0; u <= 1.0001; u += arg.step) {
        x.seek(u * x.durationMs);
        const perFrame = svg.getBoundingClientRect().width / w;
        const inLens = arg.lens && u >= arg.lens[0] && u <= arg.lens[1];
        for (const nm of arg.names) {
          const e = node(svg, nm);
          if (!e || eff(svg, e) < 0.05) continue;
          const m = e.getScreenCTM();
          const across = 100 * Math.hypot(m.a, m.b) / perFrame * 1080 / Math.min(w, h);
          stat((inLens ? 'lens ' : 'rest ') + ratio, Math.round(across * 10) / 10);
          const floor = inLens ? arg.lensMin : arg.min;
          if (across < floor - 0.05) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': ' + nm + ' ' + across.toFixed(1) + ' px < ' + floor);
        }
      }
      return out;`, {names, min, lensMin, lens, step}, {withHidden: true});
    report(ID, 'min person px', stats);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Equal visual weight of ● active / ◆ archived: paired chips have the same font size, weight, card stroke and
 * opacity; paired markers have (nearly) the same ink area and opacity; nothing in them is dashed.
 */
export function equalWeightTest(ID, {chips = [], marks = [], at = [0, 0.5, 1], tag = ''}) {
  test(`${ID}: ● active and ◆ archived get equal visual weight (type, stroke, opacity, marker size; no dashes)${tag}`, async ({page}) => {
    test.setTimeout(300000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      const tag = pr.name + ' ' + ratio;
      for (const u of arg.at) {
        x.seek(u * x.durationMs);
        for (const [a, b] of arg.chips) {
          const A = svg.querySelector(a), B = svg.querySelector(b);
          if (!A && !B) continue;
          if (!A || !B) { out.push(tag + ': only one of ' + a + ' / ' + b); continue; }
          const ta = A.querySelector('text'), tb = B.querySelector('text');
          if (ta && tb) {
            const fa = parseFloat(getComputedStyle(ta).fontSize) * ta.getScreenCTM().a, fb = parseFloat(getComputedStyle(tb).fontSize) * tb.getScreenCTM().a;
            if (Math.abs(fa - fb) > 0.2) out.push(tag + ' u=' + u + ': font ' + fa.toFixed(2) + ' vs ' + fb.toFixed(2));
            if (getComputedStyle(ta).fontWeight !== getComputedStyle(tb).fontWeight) out.push(tag + ': weight differs');
          }
          const pa = A.querySelector('path'), pb = B.querySelector('path');
          if (pa && pb && (pa.getAttribute('stroke-width') !== pb.getAttribute('stroke-width') || pa.getAttribute('stroke') !== pb.getAttribute('stroke'))) out.push(tag + ': card stroke differs');
          if (Math.abs(eff(svg, A) - eff(svg, B)) > 0.01) out.push(tag + ' u=' + u + ': opacity ' + eff(svg, A) + ' vs ' + eff(svg, B));
          for (const e of [...A.querySelectorAll('*'), ...B.querySelectorAll('*')]) if (e.getAttribute('stroke-dasharray')) out.push(tag + ': dashed stroke in a compared element');
        }
        for (const [a, b] of arg.marks) {
          const A = svg.querySelector(a), B = svg.querySelector(b);
          if (!A || !B) continue;
          const ink = e => { const q = box(e); return e.tagName === 'circle' ? Math.PI * (q.w / 2) * (q.h / 2) : q.w * q.h / 2; };
          const ra = ink(A), rb = ink(B);
          if (ra > 0 && rb > 0 && Math.max(ra, rb) / Math.min(ra, rb) > 1.35) out.push(tag + ' u=' + u + ': marker ink areas ' + ra.toFixed(0) + ' vs ' + rb.toFixed(0));
          if (Math.abs(eff(svg, A) - eff(svg, B)) > 0.01) out.push(tag + ' u=' + u + ': marker opacity differs');
          if (A.getAttribute('fill') !== B.getAttribute('fill')) out.push(tag + ': marker fill differs');
        }
      }
      return out;`, {chips, marks, at});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Legal wording and marks (civil-claim-04): no visible text states a valid or required method, "deemed" service, a
 * deadline / time limit / "plazo", an effect or consequence of a (questioned) communication, validity, a verdict or a
 * penalty; no red accent; the ONLY dashed strokes are the disputed marker (data-disputed, questioned state) and
 * draw-on reveals (data-draw).
 */
export function neutralityTest(ID) {
  test(`${ID}: no invented notification rule in the text; no red accent; dashes only on the disputed marker`, async ({page}) => {
    test.setTimeout(300000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      const re = /\\b(deemed|tenid[oa]s? por|se tiene por|valid\\w*|v[aá]lid\\w*|invalid\\w*|void|nul[oa]s?|nulidad|effective\\w*|eficaz\\w*|efect(o|os)\\b|effects?\\b|consequen\\w*|consecuencia\\w*|plazos?|deadlines?|time limits?|due\\b|vencid\\w*|venc\\w*miento|expir\\w*|caduc\\w*|within|dentro de|required|obligatori\\w*|must|debe\\w*|proper\\w*|correct\\w*|defect\\w*|irregular\\w*|failed|fallid\\w*|rejected|rechazad\\w*|verdict\\w*|veredicto|fallo|sentencia|ruling|penal\\w*|sanci\\w*|sanction\\w*|guilt\\w*|culpa\\w*|wins?|gana\\w*|loses?|pierde\\w*)\\b/i;
      const reds = ['#c8553d', '#d1495b', '#b5543c'];
      for (const u of [0, 0.3, 0.5, 0.75, 0.9, 1]) {
        x.seek(u * x.durationMs);
        for (const t of texts(svg, 0.05)) if (re.test(t.textContent)) out.push(pr.name + ' ' + ratio + ': "' + t.textContent.slice(0, 40) + '"');
        const scene = svg.querySelector('[data-layer="scene"]');
        for (const e of scene.querySelectorAll('*')) {
          if (e.closest('mask, clipPath, defs')) continue;
          if (eff(svg, e) < 0.05) continue;
          if (e.getAttribute('stroke-dasharray') && !e.hasAttribute('data-draw') && !e.closest('[data-disputed]')) out.push(pr.name + ' ' + ratio + ' u=' + u + ': dashed ' + (e.getAttribute('data-node') || e.tagName));
          const f = (e.getAttribute('fill') || '').toLowerCase(), s = (e.getAttribute('stroke') || '').toLowerCase();
          if (reds.includes(f) || reds.includes(s)) out.push(pr.name + ' ' + ratio + ' u=' + u + ': red accent on ' + (e.getAttribute('data-node') || e.tagName));
        }
      }
      return out;`, {}, {withHidden: true});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/** No directed arrowheads (marker-end / arrow paths) anywhere in the scene. */
export function noArrowsTest(ID) {
  test(`${ID}: no directed institutional arrows (no marker-end / arrowheads) in any preset × ratio`, async ({page}) => {
    test.setTimeout(300000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      for (const u of [0.5, 1]) {
        x.seek(u * x.durationMs);
        for (const e of svg.querySelectorAll('[marker-end], [marker-start], marker, [data-node*="arrow"]')) if (!e.closest('[data-layer="content-notice"]')) out.push(pr.name + ' ' + ratio + ': ' + (e.getAttribute('data-node') || e.tagName));
      }
      return out;`, {});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Seek-history independence: the SVG played forward at 60 fps from 0 equals the SVG of a fresh instance seeked
 * directly, at each listed u (every preset × ratio, labels shown and hidden). Same instanceId for both.
 */
export function seekHistoryTest(ID, {at = [0.45, 0.6, 0.8, 1]} = {}) {
  test(`${ID}: played forward at 60 fps = fresh seek (SVG markup) at u ${at.join(', ')}`, async ({page}) => {
    test.setTimeout(900000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const out = await page.evaluate(async ([id, presets, ratios, at]) => {
      const def = await window.__lib.load(id);
      const bad = [];
      let compared = 0;
      const snap = async (params, w, h, iid, us, played) => {
        const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, instanceId: iid, params});
        await x.ready;
        const res = {};
        if (played) {
          let ms = 0;
          for (const u of us) {
            const end = u * x.durationMs;
            for (; ms < end - 1e-6; ms += 1000 / 60) x.seek(ms);
            x.seek(end);
            res[u] = x.element.outerHTML;
          }
        } else {
          for (const u of us) {
            x.destroy(); el.remove();
            const el2 = document.createElement('div'); document.getElementById('slots').appendChild(el2);
            const y = def.create(el2, {width: w, height: h, instanceId: iid, params});
            await y.ready;
            y.seek(u * y.durationMs);
            res[u] = y.element.outerHTML;
            y.destroy(); el2.remove();
          }
          return res;
        }
        x.destroy(); el.remove();
        return res;
      };
      for (const pr of presets) for (const tv of [null, 'none']) for (const [ratio, w, h] of ratios) {
        const params = tv ? {...pr.params, textVisibility: tv} : pr.params;
        const A = await snap(params, w, h, 'seekcmp', at, true);
        const B = await snap(params, w, h, 'seekcmp', at, false);
        for (const u of at) {
          compared++;
          if (A[u] !== B[u]) {
            let i = 0; while (i < A[u].length && A[u][i] === B[u][i]) i++;
            bad.push(`${pr.name}${tv ? ' (labels hidden)' : ''} ${ratio} u=${u}: differs at ${i}: …${A[u].slice(Math.max(0, i - 80), i + 60)}… vs …${B[u].slice(Math.max(0, i - 80), i + 60)}…`);
          }
        }
      }
      return {bad, compared};
    }, [ID, presets, RATIOS, at]);
    console.log(`[civil-claim-04] ${ID} seek-history: ${out.compared} comparisons, ${out.bad.length} differ`);
    expect(out.compared).toBeGreaterThan(20);
    expect(out.bad.slice(0, 6), out.bad.slice(0, 6).join('\n')).toEqual([]);
  });
}

/**
 * No half-empty frame lasts more than `maxMs` (60 fps over [u0, u1]): the frame's caption-safe box is split into a
 * 12 × 12 grid; a cell counts as filled when a visible (opacity >= 0.3) element from `selectors` covers its centre.
 * A frame is half-empty when fewer than `minShare` of the cells are filled. Reports the largest blank window.
 */
export function blankWindowTest(ID, {selectors, u0 = 0, u1 = 1, maxMs = 200, minShare = 0.5}) {
  test(`${ID}: no half-empty frame (< ${minShare} of the safe box filled) for more than ${maxMs} ms (60 fps, u ${u0}–${u1})`, async ({page}) => {
    test.setTimeout(900000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      const F = svg.getBoundingClientRect();
      const sx = F.width / w, sy = F.height / h;
      // caption-safe box of the default safe area (left/right 6 %, top 6 %, bottom 20 %) in screen px
      const S = {l: F.left + w * 0.06 * sx, t: F.top + h * 0.06 * sy, r: F.left + w * 0.94 * sx, b: F.top + h * 0.8 * sy};
      const N = 12;
      let run = 0, worst = 0, minShare = 1;
      for (let ms = arg.u0 * x.durationMs; ms <= arg.u1 * x.durationMs + 1e-6; ms += 1000 / 60) {
        x.seek(ms);
        const bs = arg.selectors.flatMap(sel => [...svg.querySelectorAll(sel)]).filter(e => eff(svg, e) >= 0.3).map(box).filter(q => q.w > 1 && q.h > 1);
        let filled = 0;
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
          const cx = S.l + (i + 0.5) * (S.r - S.l) / N, cy = S.t + (j + 0.5) * (S.b - S.t) / N;
          if (bs.some(q => cx >= q.l && cx <= q.r && cy >= q.t && cy <= q.b)) filled++;
        }
        const share = filled / (N * N);
        minShare = Math.min(minShare, share);
        run = share < arg.minShare ? run + 1000 / 60 : 0;
        worst = Math.max(worst, run);
      }
      stat('worst blank ms ' + ratio, Math.round(worst), 'max');
      stat('min fill share ' + ratio, Math.round(minShare * 100) / 100);
      if (worst > arg.maxMs) out.push(pr.name + ' ' + ratio + ': half-empty for ' + Math.round(worst) + ' ms');
      return out;`, {selectors, u0, u1, maxMs, minShare}, {withHidden: true});
    report(ID, 'blank windows', stats);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * People (side-view rigs): every visible head ([data-node$="-pa-head"], [data-node$="-pb-head"], outside a lens copy)
 * is >= min px (the smaller side of its box, 1080p) at every sampled u; during [lens0, lens1] the floor is lensMin.
 * Labels shown and hidden.
 */
export function headSizeTest(ID, {min = 52, lensMin = 45, lens = null, step = 0.05, sel = '[data-node$="-pa-head"], [data-node$="-pb-head"]'} = {}) {
  test(`${ID}: heads >= ${min} px${lens ? ` (>= ${lensMin} px while the lens is open)` : ''} at every u (step ${step}), labels shown and hidden`, async ({page}) => {
    test.setTimeout(600000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      for (let u = 0; u <= 1.0001; u += arg.step) {
        x.seek(u * x.durationMs);
        const K = svg.getBoundingClientRect().width / w;
        const inLens = arg.lens && u >= arg.lens[0] && u <= arg.lens[1];
        for (const e of svg.querySelectorAll(arg.sel)) {
          if (e.closest('[data-node="lens-content"]') || eff(svg, e) < 0.05) continue;
          const b = box(e);
          const px = Math.min(b.w, b.h) / K * 1080 / Math.min(w, h);
          stat((inLens ? 'lens ' : 'rest ') + ratio, Math.round(px * 10) / 10);
          const floor = inLens ? arg.lensMin : arg.min;
          if (px < floor - 0.05) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': ' + e.getAttribute('data-node') + ' ' + px.toFixed(1) + ' px < ' + floor);
        }
      }
      return out;`, {min, lensMin, lens, step, sel}, {withHidden: true});
    report(ID, 'min head px', stats);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Chips off props, heads and text at EVERY sampled u (the file moves): no visible chip (tags, key, notes, headers,
 * relation labels) intersects a visible drawn part of a prop group, a head, or a text it does not own.
 */
export function chipsOffTest(ID, {chips, props, step = 0.02, heads = '[data-node$="-pa-head"], [data-node$="-pb-head"]'}) {
  test(`${ID}: chips never lie on a prop, a head or a text they do not own, at every u (step ${step})`, async ({page}) => {
    test.setTimeout(900000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      const meet = (a, b) => Math.min(a.r, b.r) - Math.max(a.l, b.l) > 1.5 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 1.5;
      for (let u = 0; u <= 1.0001; u += arg.step) {
        x.seek(u * x.durationMs);
        const cs = [...svg.querySelectorAll(arg.chips)].filter(e => eff(svg, e) > 0.3 && !e.closest('[data-node="lens-content"]'));
        if (!cs.length) continue;
        const parts = [...svg.querySelectorAll(arg.props)].flatMap(g0 => [...g0.querySelectorAll('path, rect, circle, ellipse, polygon, line')].filter(e => eff(svg, e) > 0.3 && !e.closest('clipPath, defs, [data-node="lens-content"]')).map(e => ({e, n: g0.getAttribute('data-node')})));
        const hs = [...svg.querySelectorAll(arg.heads)].filter(e => eff(svg, e) > 0.05 && !e.closest('[data-node="lens-content"]'));
        const T = texts(svg, 0.3).filter(t => !t.closest('[data-node="lens-content"]'));
        for (const c of cs) {
          const b = box(c);
          const p = parts.find(q => !c.contains(q.e) && !q.e.contains(c) && meet(b, box(q.e)));
          if (p) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': ' + c.getAttribute('data-node') + ' on ' + p.n);
          if (hs.some(hd => meet(b, box(hd)))) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': ' + c.getAttribute('data-node') + ' on a head');
          const t = T.find(q => !c.contains(q) && meet(b, box(q)));
          if (t) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': ' + c.getAttribute('data-node') + ' on "' + t.textContent.slice(0, 18) + '"');
        }
      }
      return out;`, {chips, props, step, heads}, {withHidden: true});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/** Fill: the scene fills the caption-safe box (>= a on its long axis, >= b on the other) at every listed u. */
export function fillTest(ID, {at = [0, 0.5, 1], a = 0.9, b = 0.6, sel = '[data-layer="scene"]'} = {}) {
  test(`${ID}: the scene fills the caption-safe box (>= ${a} / >= ${b}) at u ${at.join(', ')}, labels shown and hidden`, async ({page}) => {
    test.setTimeout(300000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      const m = svg.getScreenCTM().inverse();
      const vb = svg.viewBox.baseVal;
      for (const u of arg.at) {
        x.seek(u * x.durationMs);
        const sc = svg.querySelector(arg.sel).getBoundingClientRect();
        const p1 = new DOMPoint(sc.left, sc.top).matrixTransform(m), p2 = new DOMPoint(sc.right, sc.bottom).matrixTransform(m);
        const fw = (p2.x - p1.x) / (vb.width * 0.88), fh = (p2.y - p1.y) / (vb.height * 0.74);
        stat('min short-axis fill ' + ratio, Math.round(Math.min(fw, fh) * 100) / 100);
        if (Math.max(fw, fh) < arg.a || Math.min(fw, fh) < arg.b) out.push(pr.name + ' ' + ratio + ' u=' + u + ': fill ' + fw.toFixed(2) + ' × ' + fh.toFixed(2));
      }
      return out;`, {at, a, b, sel}, {withHidden: true});
    report(ID, 'fill', stats);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Locale es with default params only: every untouched default is shown in Spanish — no English word renders (labels
 * shown, every ratio, sampled u). A supplied English value would be kept as supplied; here none is supplied.
 */
export function esDefaultsTest(ID) {
  test(`${ID}: locale es with default params renders no English text (every ratio, u 0–1)`, async ({page}) => {
    test.setTimeout(300000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const bad = await page.evaluate(async ([id, ratios]) => {
      const def = await window.__lib.load(id);
      const re = /\b(Party|Sending|Other party|Leg|Legs|Sequence|configured|supplied|dates?|documented|questioned|Changed|file|tray|Out|In|Mail room|Front desk|Case|fictional|was|winner|detail|Relation|plain line|places|travels|Calendar|Everything|example)\b/;
      const out = [];
      for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {locale: 'es'}});
        await x.ready;
        for (const u of [0, 0.3, 0.5, 0.7, 0.9, 1]) {
          x.seek(u * x.durationMs);
          for (const t of x.element.querySelectorAll('text')) {
            if (t.closest('[data-layer="content-notice"]')) continue;
            const s = (t.textContent || '').trim();
            if (s && re.test(s)) out.push(`${ratio} u=${u}: "${s.slice(0, 50)}"`);
          }
        }
        x.destroy(); el.remove();
      }
      return [...new Set(out)].slice(0, 30);
    }, [ID, RATIOS]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Full-body people floor measured on the rendered FIGURE height (coordinator 2026-10-04, LAW-0203 method): the union of
 * a person group (`…-pa` / `…-pb`) and its near arm (`…-nw`), outside any lens, >= min px at 1080p, every u (step),
 * every preset × ratio × labels shown/hidden.
 */
export function figureSizeTest(ID, {min = 60, lensMin = 45, lens = null, step = 0.05} = {}) {
  test(`${ID}: full figures >= ${min} px tall${lens ? ` (>= ${lensMin} px while the lens is open)` : ''} (rendered figure height) at every u (step ${step}), labels shown and hidden`, async ({page}) => {
    test.setTimeout(600000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      const K = svg.getBoundingClientRect().width / w;
      for (let u = 0; u <= 1.0001; u += arg.step) {
        x.seek(u * x.durationMs);
        for (const g of svg.querySelectorAll('[data-node$="-pa"], [data-node$="-pb"]')) {
          if (g.closest('[data-node="lens"]') || eff(svg, g) < 0.3) continue;
          const nw = svg.querySelector('[data-node="' + g.dataset.node + '-nw"]');
          const bs = [g, nw].filter(Boolean).map(e => e.getBoundingClientRect()).filter(b => b.height > 0);
          const px = (Math.max(...bs.map(b => b.bottom)) - Math.min(...bs.map(b => b.top))) / K * 1080 / Math.min(w, h);
          const inLens = arg.lens && u >= arg.lens[0] && u <= arg.lens[1];
          stat((inLens ? 'lens ' : 'rest ') + ratio, Math.round(px * 10) / 10);
          if (px < (inLens ? arg.lensMin : arg.min) - 0.05) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': ' + g.dataset.node + ' ' + px.toFixed(1) + ' px');
        }
      }
      return out;`, {min, lensMin, lens, step}, {withHidden: true});
    report(ID, 'min figure px', stats);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}
