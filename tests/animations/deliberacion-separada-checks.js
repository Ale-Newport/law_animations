// Rendered-DOM checks shared by the four "Deliberación separada" entries (LAW-0229..0232).
// Every size and share is measured on the RENDERED DOM at 1080p (getBoundingClientRect / getScreenCTM ×
// computed font size), in every preset × ratio (AUTHORING items 11, 17, 20; lens rules at line 109).
import {test, expect} from '@playwright/test';
import {presetsFor} from '../harness/contract.js';

export const RATIOS = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];
export const BASELINES = ['default', 'baseline-illustrative', 'baseline-es'];

// In-page helpers (serialised into page.evaluate): effective opacity, 1080p scale, boxes.
export const HELPERS = `
  const eff = (svg, e) => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null && a !== undefined && a !== '') o *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return o; };
  const box = e => { const b = e.getBoundingClientRect(); return {l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height}; };
  const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;
  const texts = (svg, minOp = 0.05) => [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]') && (t.textContent || '').trim() && eff(svg, t) >= minOp && t.getBoundingClientRect().width > 0.5);
`;

async function forAll(page, ID, fn, arg, {withHidden = false} = {}) {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  return page.evaluate(async ([id, presets, ratios, src, arg, withHidden, helpers]) => {
    const def = await window.__lib.load(id);
    const body = new Function('x', 'svg', 'pr', 'ratio', 'w', 'h', 'arg', `${helpers}; return (async () => { ${src} })();`);
    const out = [];
    for (const pr of presets) for (const tv of withHidden ? [null, 'none'] : [null]) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const params = tv ? {...pr.params, textVisibility: tv} : pr.params;
      const x = def.create(el, {width: w, height: h, params});
      await x.ready;
      const res = await body(x, x.element, {...pr, name: pr.name + (tv ? ' (labels hidden)' : '')}, ratio, w, h, arg);
      if (res && res.length) out.push(...res);
      x.destroy();
      el.remove();
    }
    return [...new Set(out)].slice(0, 40);
  }, [ID, presets, RATIOS, fn, arg, withHidden, HELPERS]);
}

/** Every visible text >= 19.5 px (baselines) / >= 16 px (other presets) at 1080p at EVERY sampled u. */
export function textFloorTest(ID, {step = 0.01} = {}) {
  test(`${ID}: every visible text >= 19.5 px in default/baseline/baseline-es and >= 16 px elsewhere, at every u (step ${step})`, async ({page}) => {
    test.setTimeout(400000);
    const bad = await forAll(page, ID, `
      const out = [];
      const floor = arg.baselines.includes(pr.name) ? 19.5 : 16;
      for (let u = 0; u <= 1.0001; u += arg.step) {
        x.seek(u * x.durationMs);
        const s0 = svg.getScreenCTM().a;
        for (const t of texts(svg, 0.05)) {
          const m = t.getScreenCTM();
          const pxs = parseFloat(getComputedStyle(t).fontSize) * (Math.hypot(m.a, m.b) / s0) * 1080 / Math.min(w, h);
          if (pxs < floor - 0.05) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': "' + t.textContent.slice(0, 24) + '" ' + pxs.toFixed(1) + ' px < ' + floor);
        }
      }
      return out;`, {step, baselines: BASELINES});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/** No visible text leaves the frame at any u (and no named chip body). */
export function inFrameTest(ID, {step = 0.005, clipped = []} = {}) {
  test(`${ID}: no visible text or chip extends past the frame at any u (step ${step})`, async ({page}) => {
    test.setTimeout(400000);
    const bad = await forAll(page, ID, `
      const out = [];
      const F = svg.getBoundingClientRect();
      const outside = b => b.l < F.left - 0.5 || b.t < F.top - 0.5 || b.r > F.right + 0.5 || b.b > F.bottom + 0.5;
      const skip = t => arg.clipped.some(sel => t.closest(sel));
      for (let u = 0; u <= 1.0001; u += arg.step) {
        x.seek(u * x.durationMs);
        for (const t of texts(svg, 0.05)) if (!skip(t) && outside(box(t))) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(3) + ': "' + t.textContent.slice(0, 28) + '"');
        for (const sel of arg.clipped) for (const c of svg.querySelectorAll(sel)) if (eff(svg, c) > 0.05 && outside(box(c))) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(3) + ': ' + sel + ' outside the frame');
      }
      return out;`, {step, clipped});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Texts never overlap each other, and markers/chips (selectors) never lie over (drawn above) a text that is not their own,
 * at every sampled u (opacity >= 0.3). `opaque` selectors are occluding overlays (their covered texts count hidden).
 */
export function noOverlapTest(ID, {step = 0.01, markers = [], opaque = [], pad = 1} = {}) {
  test(`${ID}: texts never overlap, and markers/chips never cover a text, at every u (step ${step})`, async ({page}) => {
    test.setTimeout(400000);
    const bad = await forAll(page, ID, `
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
          // (a marker drawn beneath a text — earlier in document order — never hides it)
          for (const t of T) if (!m.contains(t) && (m.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_PRECEDING) && hit(mb, box(t), arg.pad)) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': ' + sel + ' covers "' + t.textContent.slice(0, 18) + '"');
        }
      }
      return out;`, {step, markers, opaque, pad});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/** create() <= 1 s COLD (fresh page) in every preset × ratio. */
export function coldCreateTest(ID) {
  test(`${ID}: cold create() <= 1 s in every preset × ratio (fresh page each)`, async ({browser}) => {
    test.setTimeout(300000);
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const slow = [];
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
      if (ms > 1000) slow.push(`${pr.name} ${ratio}: ${Math.round(ms)} ms`);
      await page.close();
    }
    expect(slow, slow.join('\n')).toEqual([]);
  });
}

/**
 * People (data-node names) are >= min px across (1080p) at every sampled u; during [lensFrom, lensTo] the floor is
 * lensMin. The people floors are coordinator decisions recorded in production/SESSION_HANDOFF.md (people >= 60 px,
 * >= 45 px while a lens holds the frame; contrast 1:1 >= 55 px, stress 1:1 >= 45 px): these tests use 60 px (45 in
 * the lens), the strictest applicable. Also labels hidden.
 */
export function peopleSizeTest(ID, {names, min = 60, lensMin = 45, lens = null, step = 0.05}) {
  test(`${ID}: people >= ${min} px across (>= ${lensMin} px while the lens is open) at every u (step ${step}), labels shown and hidden`, async ({page}) => {
    test.setTimeout(400000);
    const bad = await forAll(page, ID, `
      const out = [];
      for (let u = 0; u <= 1.0001; u += arg.step) {
        x.seek(u * x.durationMs);
        const perFrame = svg.getBoundingClientRect().width / w;
        const inLens = arg.lens && u >= arg.lens[0] && u <= arg.lens[1];
        for (const nm of arg.names) {
          const e = svg.querySelector('[data-node="' + nm + '"]');
          if (!e || eff(svg, e) < 0.05) continue;
          // a plan person is 100 template units across the shoulders (PERSON.half = 50)
          const m = e.getScreenCTM();
          const across = 100 * Math.hypot(m.a, m.b) / perFrame * 1080 / Math.min(w, h);
          const floor = inLens ? arg.lensMin : arg.min;
          if (across < floor - 0.5) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': ' + nm + ' ' + across.toFixed(1) + ' px < ' + floor);
        }
      }
      return out;`, {names, min, lensMin, lens, step}, {withHidden: true});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Equal visual weight of the compared pair (● audiencia / ◆ deliberación): the two chips have the same font size,
 * weight, card stroke width and opacity; the two markers have (nearly) the same rendered area; none of them uses a
 * dash pattern. pairs: [[selA, selB], ...] of chips; marks: [selA, selB].
 */
export function equalWeightTest(ID, {chips = [], marks = [], at = [0, 0.5, 1]}) {
  test(`${ID}: ● and ◆ get equal visual weight (same type size, weight, stroke, opacity; markers the same size; no dashes)`, async ({page}) => {
    test.setTimeout(300000);
    const bad = await forAll(page, ID, `
      const out = [];
      const tag = pr.name + ' ' + ratio;
      for (const u of arg.at) {
        x.seek(u * x.durationMs);
        for (const [a, b] of arg.chips) {
          const A = svg.querySelector(a), B = svg.querySelector(b);
          if (!A && !B) continue;
          if (!A || !B) { out.push(tag + ': only one of ' + a + ' / ' + b); continue; }
          const ta = A.querySelector('text'), tb = B.querySelector('text');
          const fa = parseFloat(getComputedStyle(ta).fontSize) * ta.getScreenCTM().a, fb = parseFloat(getComputedStyle(tb).fontSize) * tb.getScreenCTM().a;
          if (Math.abs(fa - fb) > 0.2) out.push(tag + ' u=' + u + ': font ' + fa.toFixed(2) + ' vs ' + fb.toFixed(2));
          if (getComputedStyle(ta).fontWeight !== getComputedStyle(tb).fontWeight) out.push(tag + ': weight differs');
          const pa = A.querySelector('path'), pb = B.querySelector('path');
          if (pa.getAttribute('stroke-width') !== pb.getAttribute('stroke-width') || pa.getAttribute('stroke') !== pb.getAttribute('stroke')) out.push(tag + ': card stroke differs');
          if (Math.abs(eff(svg, A) - eff(svg, B)) > 0.01) out.push(tag + ' u=' + u + ': opacity ' + eff(svg, A) + ' vs ' + eff(svg, B));
          for (const e of [...A.querySelectorAll('*'), ...B.querySelectorAll('*')]) if (e.getAttribute('stroke-dasharray')) out.push(tag + ': dashed stroke in a compared chip');
        }
        if (arg.marks.length === 2) {
          const [A, B] = arg.marks.map(s => svg.querySelector(s));
          if (A && B) {
            // ink area of a solid marker: a circle (●) is π r², a diamond (◆) half its bounding box
            const ink = e => { const b = box(e); return e.tagName === 'circle' ? Math.PI * (b.w / 2) * (b.h / 2) : b.w * b.h / 2; };
            const ra = ink(A), rb = ink(B);
            if (ra > 0 && rb > 0 && Math.max(ra, rb) / Math.min(ra, rb) > 1.35) out.push(tag + ' u=' + u + ': marker ink areas ' + ra.toFixed(0) + ' vs ' + rb.toFixed(0));
            if (Math.abs(eff(svg, A) - eff(svg, B)) > 0.01) out.push(tag + ' u=' + u + ': marker opacity differs');
            if (A.getAttribute('stroke-dasharray') || B.getAttribute('stroke-dasharray')) out.push(tag + ': dashed marker');
          }
        }
      }
      return out;`, {chips, marks, at});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Legal wording: no visible text uses words that would invent procedure (secrecy, votes, majority, verdict,
 * decision reached, time spans / "plazo", who may attend). Checked at the hold in every preset × ratio.
 */
export function wordingTest(ID) {
  test(`${ID}: no visible text invents procedure (secrecy, vote, majority, verdict, deadline/plazo, attendance rules)`, async ({page}) => {
    test.setTimeout(300000);
    const bad = await forAll(page, ID, `
      const out = [];
      const re = /\\b(secre\\w*|confiden\\w*|vot\\w*|majorit\\w*|mayor[ií]a|verdict\\w*|veredicto|fallo|sentencia|decision reached|decisi[oó]n adoptada|deadline|plazo|time limit|due\\b|jury|jurado|judge|juez|magistrad\\w*|may not attend|no pueden? asistir|allowed|permitid\\w*|prohibid\\w*|forbidden)/i;
      for (const u of [0, 0.5, 1]) {
        x.seek(u * x.durationMs);
        for (const t of texts(svg, 0.05)) if (re.test(t.textContent)) out.push(pr.name + ' ' + ratio + ': "' + t.textContent.slice(0, 40) + '"');
      }
      return out;`, {});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/** No directed arrowheads (marker-end / arrow paths) anywhere in the scene at the hold. */
export function noArrowsTest(ID) {
  test(`${ID}: no directed institutional arrows (no marker-end / arrowheads) in any preset × ratio`, async ({page}) => {
    test.setTimeout(300000);
    const bad = await forAll(page, ID, `
      const out = [];
      x.seek(x.durationMs);
      for (const e of svg.querySelectorAll('[marker-end], [marker-start], marker, [data-node*="arrow"]')) if (!e.closest('[data-layer="content-notice"]')) out.push(pr.name + ' ' + ratio + ': ' + (e.getAttribute('data-node') || e.tagName));
      return out;`, {});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

// Content extent: the union of the visible named nodes' boxes (the content notice excluded), in viewBox units.
const CONTENT = `
  const vbx = svg.viewBox.baseVal; const inv = svg.getScreenCTM().inverse();
  const toV = r0 => { const a = new DOMPoint(r0.left, r0.top).matrixTransform(inv), b = new DOMPoint(r0.right, r0.bottom).matrixTransform(inv); return {x0: a.x, y0: a.y, x1: b.x, y1: b.y}; };
  let leaves = null;
  const content = () => { if (!leaves) leaves = [...svg.querySelectorAll('[data-node]')].filter(e => !e.closest('[data-layer="content-notice"]') && (!e.querySelector('[data-node]') || e.getAttribute('data-node') === 'panel'));
    let U = null; for (const e of leaves) { if (eff(svg, e) < 0.05) continue; const r0 = e.getBoundingClientRect(); if (r0.width < 1 || r0.height < 1) continue; const q = toV(r0); U = U ? {x0: Math.min(U.x0, q.x0), y0: Math.min(U.y0, q.y0), x1: Math.max(U.x1, q.x1), y1: Math.max(U.y1, q.y1)} : q; }
    if (!U) return {w: 0, h: 0, a: 0};
    const x0 = Math.max(U.x0, vbx.x), y0 = Math.max(U.y0, vbx.y), x1 = Math.min(U.x1, vbx.x + vbx.width), y1 = Math.min(U.y1, vbx.y + vbx.height);
    return {w: (x1 - x0) / vbx.width, h: (y1 - y0) / vbx.height, a: ((x1 - x0) * (y1 - y0)) / (vbx.width * vbx.height)}; };
`;

/**
 * AUTHORING item 11 ("the subject should fill most of the caption-safe box … with and without labels"), measured on
 * the RENDERED content (union of the visible nodes): at rest, build and hold, labels shown AND hidden, the content
 * covers more than half of the caption-safe box area (0.88 × 0.74 of the frame with the default safe area).
 */
export function fillMostTest(ID, {at = [0.05, 0.5, 1], share = 0.5} = {}) {
  test(`${ID}: the content fills most of the caption-safe box (> ${share} of its area) at rest, build and hold, labels shown and hidden`, async ({page}) => {
    test.setTimeout(300000);
    const bad = await forAll(page, ID, `${CONTENT}
      const out = [];
      for (const u of arg.at) { x.seek(u * x.durationMs); const c = content(); const sh = c.a / (0.88 * 0.74); if (sh <= arg.share) out.push(pr.name + ' ' + ratio + ' u=' + u + ': content ' + c.w.toFixed(3) + ' x ' + c.h.toFixed(3) + ' of the frame = ' + sh.toFixed(2) + ' of the safe box'); }
      return out;`, {at, share}, {withHidden: true});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * No empty transitions (item 19): at 60 fps the longest stretch where the visible content covers < 0.3 of the frame
 * lasts <= 200 ms, labels shown and hidden.
 */
export function thinContentTest(ID, {limitMs = 200, share = 0.3} = {}) {
  test(`${ID}: no stretch > ${limitMs} ms with content < ${share} of the frame (60 fps, labels shown and hidden)`, async ({page}) => {
    test.setTimeout(600000);
    const bad = await forAll(page, ID, `${CONTENT}
      const out = [];
      let run = 0, worst = 0, at = 0;
      for (let ms = 0; ms <= x.durationMs + 1e-6; ms += 1000 / 60) { x.seek(ms); const c = content(); run = c.a < arg.share ? run + 1000 / 60 : 0; if (run > worst) { worst = run; at = ms; } }
      if (worst > arg.limitMs) out.push(pr.name + ' ' + ratio + ': content < ' + arg.share + ' of the frame for ' + Math.round(worst) + ' ms (ending ' + Math.round(at) + ' ms)');
      return out;`, {limitMs, share}, {withHidden: true});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}
