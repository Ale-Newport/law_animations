// Rendered-DOM checks shared by the "Modificación del escrito" tests (LAW-0265..0268). Copied from
// tests/animations/contestacion-estructurada-checks.js (copied, not imported: each motif owns its checks) and extended.
// Each export is the source of a DOM expression for tests/harness/ratio-checks.js (`svg` = the rendered
// root, `visible(el)` = no ancestor hidden). Distances are converted to px at 1080p (the short side of the
// frame is 1080 px) so the thresholds do not depend on the test page's slot size.

/** px-per-1080p-px factor on screen for the current svg */
const K = `const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (Math.min(vb.width, vb.height) / 1080);`;
/** effective opacity of an element (product of ancestors' opacity attributes) */
const EFF = `const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { if (e.getAttribute('display') === 'none') return 0; const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };`;
const R = `const R = e => e.getBoundingClientRect(); const meet = (a, b, p = 0) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > p && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > p;`;

/** heads of every person on screen (stage rigs and portrait badges) */
const HEADS = `const heads = [...svg.querySelectorAll('[data-node$="-pa-head"], [data-node$="-pb-head"], [data-node$="-badge"]')].filter(e => eff(e) > 0.05 && !e.closest('[data-node="lens-content"]'));`;

/**
 * No label, chip, tag, card, note, header, strip item, lens window or guide covers a head or face:
 * every visible label-like group (and every visible text) keeps clear of every head.
 */
export const FACES_CLEAR = `(() => {
  ${K} ${EFF} ${R} ${HEADS}
  if (!heads.length) return false;
  // chip bodies of names, tags, callouts and relation labels (not their leaders), cards, headers, the lens
  const sel = '[data-node^="chip"], [data-node$="-chip"], [data-node="key"], [data-node="lens-bg"], [data-node^="strip-"], [data-node^="hdr"], [data-node="ctx-capg"], [data-node="letter-card"], [data-node^="el-"][data-node$="-lab"], [data-node^="nb-"]';
  // only what is drawn ON TOP of a head counts (later in document order); a head passing in front of a
  // prop's printed text hides that text, it is not covered by it
  const above = (e, hd) => Boolean(hd.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) && !hd.contains(e);
  const els = [...svg.querySelectorAll(sel)].filter(e => eff(e) > 0.05);
  const texts = [...svg.querySelectorAll('text')].filter(t => eff(t) > 0.05 && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"], [data-node="lens-content"]'));
  return heads.every(hd => { const h = R(hd); return [...els, ...texts].every(e => !above(e, hd) || !meet(R(e), h, 1.5 * K)); });
})()`;

/**
 * Card bodies never cover text they do not own (tests/animations/LAW-0142.test.js, round 3): every filled
 * shape that frames a text covers no other visible text drawn beneath it.
 */
export const CARDS_CLEAR = `(() => {
  ${EFF}
  const order = new Map([...svg.querySelectorAll('*')].map((e, i) => [e, i]));
  const Rb = e => e.getBoundingClientRect();
  // (a text lying wholly under an opaque overlay drawn after it — a lens window, data-occludes — is hidden)
  const occ = [...svg.querySelectorAll('[data-occludes]')].filter(o => eff(o) > 0.05).map(o => ({o, b: Rb(o)}));
  const hidden = t => { const b = Rb(t); return occ.some(q => order.get(q.o) > order.get(t) && !q.o.contains(t) && b.left >= q.b.left - 1 && b.right <= q.b.right + 1 && b.top >= q.b.top - 1 && b.bottom <= q.b.bottom + 1); };
  const texts = [...svg.querySelectorAll('text')].filter(t => eff(t) > 0.3 && !t.closest('[data-layer="content-notice"], [data-node="lens-content"]') && t.getBBox().width > 0 && (t.textContent || '').trim() && !hidden(t));
  const inside = (a, b) => a.left >= b.left - 1 && a.right <= b.right + 1 && a.top >= b.top - 1 && a.bottom <= b.bottom + 1;
  const meet = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1.5;
  const cards = [];
  for (const t of texts) {
    const tb = Rb(t);
    let g0 = t.parentElement;
    for (let up = 0; up < 3 && g0 && g0 !== svg; up++, g0 = g0.parentElement) {
      const shapes = [...g0.children].filter(c => (c.tagName === 'path' || c.tagName === 'rect') && eff(c) > 0.3 && c.getAttribute('fill') && c.getAttribute('fill') !== 'none' && order.get(c) < order.get(t));
      const card = shapes.find(c => { const b = Rb(c); return inside(tb, b) && b.width * b.height < tb.width * tb.height * 12; });
      if (card) { cards.push({card, owner: g0}); break; }
    }
  }
  for (const {card, owner} of cards) {
    const cb = Rb(card);
    for (const t of texts) {
      if (owner.contains(t) || order.get(t) > order.get(card)) continue;
      if (meet(cb, Rb(t))) return false;
    }
  }
  return true;
})()`;

/** Every visible drawn leaf lies inside the frame (the svg's own box). */
export const IN_FRAME = `(() => {
  ${EFF}
  const F = svg.getBoundingClientRect();
  // (the enlarged lens copy is clipped by its window: its own window rect is what must stay in frame)
  const leaves = [...svg.querySelectorAll('path, rect, circle, ellipse, text, line')].filter(e => !e.closest('defs, clipPath, mask, [data-node="lens-content"]') && eff(e) > 0.02);
  return leaves.every(e => { const b = e.getBoundingClientRect(); if (b.width === 0 && b.height === 0) return true; return b.left >= F.left - 0.5 && b.right <= F.right + 0.5 && b.top >= F.top - 0.5 && b.bottom <= F.bottom + 0.5; });
})()`;

/** Head size (px at 1080p) of the smallest visible person is at least MIN. */
export const headsAtLeast = min => `(() => {
  ${K} ${EFF} ${HEADS}
  if (!heads.length) return false;
  return heads.every(hd => { const b = hd.getBoundingClientRect(); return Math.min(b.width, b.height) / K >= ${min}; });
})()`;

/** The scene (without the content notice) fills the caption-safe box: >= A on its long axis and >= B on the other. */
export const fills = (a, b) => `(() => {
  const m = svg.getScreenCTM().inverse();
  const sc = svg.querySelector('[data-layer="scene"]').getBoundingClientRect();
  const p1 = new DOMPoint(sc.left, sc.top).matrixTransform(m), p2 = new DOMPoint(sc.right, sc.bottom).matrixTransform(m);
  const vb = svg.viewBox.baseVal;
  const fw = (p2.x - p1.x) / (vb.width * 0.88), fh = (p2.y - p1.y) / (vb.height * 0.74);
  return Math.max(fw, fh) >= ${a} && Math.min(fw, fh) >= ${b};
})()`;

/**
 * Each tag (a group with a dotted leader path and an anchor dot) sits beside its own element: the leader
 * from the chip edge to the anchor is at most MAX px at 1080p, and it crosses no other text.
 */
export const tagsBeside = (prefixes, max = 40) => `(() => {
  ${K} ${EFF}
  const groups = [...svg.querySelectorAll(${JSON.stringify(prefixes.map(q => `[data-node^="${q}"]`).join(', '))})].filter(e => e.tagName === 'g' && eff(e) > 0.5 && e.querySelector(':scope > circle'));
  // (the enlarged lens copy is clipped by its window, which lies outside the tags' area: its unclipped text boxes are not what shows)
  const texts = [...svg.querySelectorAll('text')].filter(t => eff(t) > 0.3 && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"], [data-node="lens-content"]'));
  for (const gr of groups) {
    const lead = gr.querySelector(':scope > path');
    if (!lead) continue;
    const L = lead.getTotalLength() * lead.getScreenCTM().a;
    if (L / K > ${max}) return false;
    const m = lead.getScreenCTM(), n = 20, pts = [];
    for (let i = 2; i < n - 1; i++) pts.push(lead.getPointAtLength((lead.getTotalLength() * i) / n).matrixTransform(m));
    for (const t of texts) {
      if (gr.contains(t)) continue;
      const b = t.getBoundingClientRect();
      if (pts.some(q => q.x > b.left && q.x < b.right && q.y > b.top && q.y < b.bottom)) return false;
    }
  }
  return true;
})()`;

/** No visible text lands on a visible filler bar (data-bar) unless an opaque body lies between them. */
export const TEXT_OFF_BARS = `(() => {
  ${EFF}
  const bars = [...svg.querySelectorAll('[data-bar]')].filter(b => eff(b) >= 0.3).map(b => ({b, r: b.getBoundingClientRect()})).filter(q => q.r.width > 0.5);
  if (!bars.length) return true;
  const lines = [...svg.querySelectorAll('text')].filter(t => eff(t) >= 0.05).flatMap(t => { const ts = [...t.querySelectorAll('tspan')]; return (ts.length ? ts : [t]).filter(q => q.textContent.trim()).map(q => ({t: q, r: q.getBoundingClientRect()})); });
  const cut = (a, b) => ({left: Math.max(a.left, b.left), right: Math.min(a.right, b.right), top: Math.max(a.top, b.top), bottom: Math.min(a.bottom, b.bottom)});
  const some = b => b.right - b.left > 0.5 && b.bottom - b.top > 0.5;
  let shapes = null;
  const opaqueBetween = (bar, txt, box) => {
    shapes = shapes || [...svg.querySelectorAll('path, rect, circle')].filter(sh => !sh.hasAttribute('data-bar') && !sh.closest('clipPath, defs') && sh.getAttribute('fill') && sh.getAttribute('fill') !== 'none' && eff(sh) >= 0.99).map(sh => ({sh, r: sh.getBoundingClientRect()}));
    // (an opaque shape drawn between the two, in either order, hides the lower one: a bar over a text hidden under
    // a lens window is not a text on a bar)
    const [lo, hi] = bar.compareDocumentPosition(txt) & Node.DOCUMENT_POSITION_FOLLOWING ? [bar, txt] : [txt, bar];
    return shapes.some(({sh, r}) => (lo.compareDocumentPosition(sh) & Node.DOCUMENT_POSITION_FOLLOWING) && (sh.compareDocumentPosition(hi) & Node.DOCUMENT_POSITION_FOLLOWING) && !sh.contains(lo) && r.left <= box.left && r.right >= box.right && r.top <= box.top && r.bottom >= box.bottom);
  };
  return lines.every(L => bars.every(B => { const box = cut(L.r, B.r); return !some(box) || opaqueBetween(B.b, L.t, box); }));
})()`;

/** Neutral glyphs only: no red or alarm fills on markers and no tick / cross paths in the scene. */
export const NEUTRAL_MARKERS = `(() => {
  const bad = [...svg.querySelectorAll('circle, path, rect')].filter(e => /^#(d1495b|ff0000|e53935|c62828)$/i.test(e.getAttribute('fill') || ''));
  return bad.length === 0;
})()`;

/**
 * Coordinator rule (AUTHORING, text size at every moment): every visible text (effective opacity ≥ 0.05) is
 * ≥ 16 px at 1080p at every sampled u, in every preset × ratio (labels shown), including the lens copy and any
 * context that shrinks while the lens is open.
 * @param {string} id
 * @param {{step?: number, presets: {name:string, params:any}[], test: any, expect: any}} o
 */
export function textSizeOverTime(id, o) {
  const {test, expect} = o;
  test.describe(`${id} text size over time`, () => {
    test(`${id}: every visible text ≥ 16 px at every sampled u`, async ({page}) => {
      test.setTimeout(400000);
      await page.goto('/tests/harness/host.html');
      await page.waitForFunction(() => document.body.dataset.ready === '1');
      const bad = await page.evaluate(async ([id, presets, step]) => {
        const def = await window.__lib.load(id);
        const out = [];
        for (const pr of presets) {
          for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
            const el = document.createElement('div');
            document.getElementById('slots').appendChild(el);
            const x = def.create(el, {width: w, height: h, params: pr.params});
            await x.ready;
            const svg = x.element;
            const eff = e => { let q0 = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) q0 *= parseFloat(a); if (q.getAttribute && q.getAttribute('display') === 'none') return 0; } return q0; };
            for (let u = 0; u <= 1.0001; u += step) {
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
      }, [id, o.presets, o.step ?? 0.02]);
      expect(bad, bad.join('\n')).toEqual([]);
    });
  });
}

/**
 * Baseline presets (default, baseline-illustrative and baseline-es) keep every visible text >= 19.5 px at 1080p at
 * the hold in every ratio (coordinator 2026-09-26: baseline-es is a baseline preset; AUTHORING item 20). The neutral
 * "as supplied · no conclusion drawn" key is required content and is included; only the harness-drawn content notice
 * is excluded.
 */
export function baselineTextAtHold(id, o) {
  const {test, expect} = o;
  test(`${id}: baseline presets (incl. baseline-es): every text >= 19.5 px at the hold in every ratio`, async ({page}) => {
    test.setTimeout(180000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
        for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: pr.params});
          await x.ready;
          x.seek(x.durationMs);
          const svg = x.element;
          const eff = e => { let q0 = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) q0 *= parseFloat(a); if (q.getAttribute && q.getAttribute('display') === 'none') return 0; } return q0; };
          const s0 = svg.getScreenCTM().a;
          for (const t of svg.querySelectorAll('text')) {
            if (t.closest('[data-layer="content-notice"]') || eff(t) < 0.3 || !(t.textContent || '').trim()) continue;
            const b = t.getBoundingClientRect();
            if (b.width < 0.5) continue;
            const pxs = parseFloat(getComputedStyle(t).fontSize) * (t.getScreenCTM().a / s0) * 1080 / Math.min(w, h);
            if (pxs < 19.5 - 0.05) out.push(`${pr.name} ${ratio}: "${t.textContent.slice(0, 24)}" ${pxs.toFixed(1)} px`);
          }
          x.destroy();
          el.remove();
        }
      }
      return out.slice(0, 40);
    }, [id, o.presets.filter(p => ['default', 'baseline-illustrative', 'baseline-es'].includes(p.name))]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Rendered: the pen and the hands never lie over a head. The head is sampled on an 11 × 11 grid; at every point
 * where the head is drawn, no pen or hand element may be stacked above it (at most 3 % of the head's points, a
 * brushing contact at its rim).
 */
export const HANDS_OFF_HEADS = `(() => {
  ${EFF}
  svg.scrollIntoView({block: 'center', inline: 'center'});
  const heads = [...svg.querySelectorAll('[data-node$="-pa-head"], [data-node$="-pb-head"]')].filter(e => eff(e) > 0.05 && !e.closest('[data-node="lens-content"]'));
  const tool = el => el.closest && el.closest('[data-node$="-pen"], [data-node$="-stamp"], [data-node$="-hand"], [data-node$="-ptr"]');
  for (const hd of heads) {
    const b = hd.getBoundingClientRect();
    if (b.width < 3 || b.height < 3) continue;
    let n = 0, hit = 0;
    for (let i = 1; i < 12; i++) for (let j = 1; j < 12; j++) {
      const st = document.elementsFromPoint(b.left + (b.width * i) / 12, b.top + (b.height * j) / 12);
      const hi = st.findIndex(e => hd.contains(e));
      if (hi < 0) continue;
      n++;
      if (st.slice(0, hi).some(e => tool(e) && eff(e) > 0.3)) hit++;
    }
    if (n && hit / n > 0.03) return false;
  }
  return true;
})()`;

/** Rendered: no head is drawn over visible text (every visible text is sampled; at most 4 % of its points under a head). */
export const HEADS_OFF_TEXT = `(() => {
  ${EFF}
  svg.scrollIntoView({block: 'center', inline: 'center'});
  const heads = [...svg.querySelectorAll('[data-node$="-pa-head"], [data-node$="-pb-head"]')].filter(e => eff(e) > 0.05 && !e.closest('[data-node="lens-content"]'));
  if (!heads.length) return true;
  const hb = heads.map(h => h.getBoundingClientRect());
  const texts = [...svg.querySelectorAll('text')].filter(t => eff(t) > 0.3 && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"], [data-node="lens-content"]'));
  for (const t of texts) {
    const b = t.getBoundingClientRect();
    if (b.width < 1 || !hb.some(h => Math.min(h.right, b.right) > Math.max(h.left, b.left) && Math.min(h.bottom, b.bottom) > Math.max(h.top, b.top))) continue;
    let n = 0, hit = 0;
    for (let i = 1; i < 16; i++) for (let j = 1; j < 4; j++) {
      const st = document.elementsFromPoint(b.left + (b.width * i) / 16, b.top + (b.height * j) / 4);
      const ti = st.findIndex(e => e === t || t.contains(e));
      n++;
      const upto = ti < 0 ? st.length : ti;
      if (st.slice(0, upto).some(e => heads.some(h => h.contains(e)))) hit++;
    }
    if (hit / n > 0.04) return false;
  }
  return true;
})()`;

/* ======================================================================== */
/* Added for LAW-0249..0252 (coordinator rules applied from the start)       */
/* ======================================================================== */

const BASELINES = ['default', 'baseline-illustrative', 'baseline-es'];

/**
 * Text floors at EVERY sampled u, in every preset × ratio (labels shown): every visible text (effective opacity
 * ≥ 0.05, the harness content notice excluded; the key included) is ≥ 19.5 px at 1080p in the baseline presets
 * (default, baseline-illustrative, baseline-es) and ≥ 16 px in every other preset.
 * @param {string} id
 * @param {{step?: number, presets: {name:string, params:any}[], test: any, expect: any}} o
 */
export function textFloorsOverTime(id, o) {
  const {test, expect} = o;
  test(`${id}: every visible text ≥ 19.5 px (baseline presets) / ≥ 16 px (others) at every sampled u`, async ({page}) => {
    test.setTimeout(600000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const bad = await page.evaluate(async ([id, presets, step, baselines]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
        const floor = baselines.includes(pr.name) ? 19.5 : 16;
        for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: pr.params});
          await x.ready;
          const svg = x.element;
          const eff = e => { let q0 = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) q0 *= parseFloat(a); if (q.getAttribute && q.getAttribute('display') === 'none') return 0; } return q0; };
          for (let u = 0; u <= 1.0001; u += step) {
            x.seek(Math.min(1, u) * x.durationMs);
            const s0 = svg.getScreenCTM().a;
            for (const t of svg.querySelectorAll('text')) {
              if (t.closest('[data-layer="content-notice"]') || eff(t) < 0.05 || !(t.textContent || '').trim()) continue;
              const b = t.getBoundingClientRect();
              if (b.width < 0.5) continue;
              const pxs = parseFloat(getComputedStyle(t).fontSize) * (t.getScreenCTM().a / s0) * 1080 / Math.min(w, h);
              if (pxs < floor - 0.05) out.push(`${pr.name} ${ratio} u=${u.toFixed(3)}: "${t.textContent.slice(0, 20)}" ${pxs.toFixed(1)} px < ${floor}`);
            }
          }
          x.destroy();
          el.remove();
        }
      }
      return [...new Set(out)].slice(0, 40);
    }, [id, o.presets, o.step ?? 0.02, BASELINES]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Frame share over time at 60 fps (every preset × ratio × labels shown/hidden): the drawn scene (the harness
 * content notice excluded) fills the frame at rest and at the hold (≥ `rest` of the frame on its long axis), and
 * the longest run of frames in which the scene's larger share of the frame drops below 0.3 lasts ≤ `maxMs`.
 * @param {string} id
 * @param {{presets: {name:string, params:any}[], test:any, expect:any, rest?:number, maxMs?:number}} o
 */
export function frameShareOverTime(id, o) {
  const {test, expect} = o;
  test(`${id}: frame share at 60 fps — fills at rest and hold, never < 0.3 of the frame for more than ${o.maxMs ?? 200} ms`, async ({page}) => {
    test.setTimeout(600000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const res = await page.evaluate(async ([id, presets, rest, maxMs]) => {
      const def = await window.__lib.load(id);
      const bad = [], worst = [];
      for (const pr of presets) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const svg = x.element;
        const vb = svg.viewBox.baseVal, m = svg.getScreenCTM();
        const p0 = new DOMPoint(vb.x, vb.y).matrixTransform(m), p1 = new DOMPoint(vb.x + vb.width, vb.y + vb.height).matrixTransform(m);
        const FW = p1.x - p0.x, FH = p1.y - p0.y;
        const share = () => { const b = svg.querySelector('[data-layer="scene"]').getBoundingClientRect(); return Math.max(b.width / FW, b.height / FH); };
        const n = Math.round(x.durationMs / (1000 / 60));
        let run = 0, longest = 0, minS = 9;
        for (let i = 0; i <= n; i++) {
          x.seek((i / n) * x.durationMs);
          const s = share();
          minS = Math.min(minS, s);
          if (s < 0.3) { run += 1000 / 60; longest = Math.max(longest, run); } else run = 0;
          if ((i === 0 || i === n) && s < rest) bad.push(`${pr.name} ${tv} ${ratio}: share ${s.toFixed(3)} < ${rest} at ${i === 0 ? 'rest' : 'hold'}`);
        }
        if (longest > maxMs) bad.push(`${pr.name} ${tv} ${ratio}: scene < 0.3 of the frame for ${Math.round(longest)} ms`);
        worst.push(`${pr.name} ${tv} ${ratio}: min ${minS.toFixed(3)}, longest < 0.3 ${Math.round(longest)} ms`);
        x.destroy();
        el.remove();
      }
      return {bad, worst};
    }, [id, o.presets, o.rest ?? 0.7, o.maxMs ?? 200]);
    expect(res.bad, res.bad.join('\n') + '\n' + res.worst.join('\n')).toEqual([]);
  });
}

/**
 * Played-forward vs fresh-seek identity: an instance played forward frame by frame (60 fps) up to each checkpoint
 * renders the same DOM as a fresh instance seeked straight there, and seeking back to 0 restores the rest frame.
 * @param {string} id
 * @param {{presets: {name:string, params:any}[], test:any, expect:any, at?: number[]}} o
 */
export function seekIdentity(id, o) {
  const {test, expect} = o;
  test(`${id}: played forward = fresh seek (every preset × ratio), seek back restores`, async ({page}) => {
    test.setTimeout(600000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const bad = await page.evaluate(async ([id, presets, at]) => {
      const def = await window.__lib.load(id);
      const out = [];
      // (each instance has its own id prefix: it is normalised away before comparing)
      let seq = 0;
      const html = x => x.element.outerHTML.split(x.iid).join('#');
      for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const mk = async () => { const el = document.createElement('div'); document.getElementById('slots').appendChild(el); const iid = `sid${seq++}q`; const x = def.create(el, {width: w, height: h, params: pr.params, instanceId: iid}); await x.ready; x.iid = iid; return {x, el}; };
        const A = await mk();
        const rest = html(A.x);
        const n = Math.round(A.x.durationMs / (1000 / 60));
        let k = 0;
        for (const u of at) {
          for (; k <= Math.round(u * n); k++) A.x.seek((k / n) * A.x.durationMs);
          A.x.seek(u * A.x.durationMs);
          const B = await mk();
          B.x.seek(u * B.x.durationMs);
          if (html(A.x) !== html(B.x)) out.push(`${pr.name} ${ratio} u=${u}: played-forward differs from fresh seek`);
          B.x.destroy(); B.el.remove();
        }
        A.x.seek(0);
        if (html(A.x) !== rest) out.push(`${pr.name} ${ratio}: seek back to 0 does not restore the rest frame`);
        A.x.destroy(); A.el.remove();
      }
      return out;
    }, [id, o.presets, o.at ?? [0.2, 0.45, 0.6, 0.75, 1]]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Rendered: no stage tag chip lies over any visible drawn part of the listed prop groups, or over any text it does
 * not own.
 * @param {string[]} groups data-node names of the prop groups
 */
export const tagsOffProps = groups => `(() => { ${EFF}
 const R = e => e.getBoundingClientRect(); const meet = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1.5;
 const chips = [...svg.querySelectorAll('[data-node^="tag-"][data-node$="-chip"]')].filter(e => eff(e) > 0.3);
 const gs = ${JSON.stringify(groups)}.map(n => svg.querySelector('[data-node="' + n + '"]')).filter(Boolean);
 const props = gs.flatMap(g0 => [...g0.querySelectorAll('path, rect, circle, ellipse, polygon, line')].filter(e => eff(e) > 0.3 && !e.closest('clipPath, defs')));
 const texts = [...svg.querySelectorAll('text')].filter(t => eff(t) > 0.3 && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
 for (const c of chips) { const b = R(c); if (props.some(p => meet(b, R(p)))) return false; if (texts.some(t => !c.contains(t) && meet(b, R(t)))) return false; }
 return true; })()`;

/**
 * Rendered: every line of every visible text is drawn on top — at the centre of each line (tspan) no other element is
 * stacked above the text (no prop, counter or person hides a label's line). Texts under an open lens window
 * (data-occludes) and the enlarged lens copy are exempt.
 */
export const TEXT_LINES_VISIBLE = `(() => {
  ${EFF}
  // (the slot is brought to the front of the test page, so that hit-testing sees this animation only)
  const slot = svg.parentElement, keep = slot.getAttribute('style') || '';
  slot.setAttribute('style', keep + ';position:fixed;left:0;top:0;z-index:99999;background:#fff');
  let ok = true, n = 0;
  const occ = [...svg.querySelectorAll('[data-occludes]')].filter(o => eff(o) > 0.05).map(o => o.getBoundingClientRect());
  for (const t of svg.querySelectorAll('text')) {
    if (eff(t) < 0.9 || !(t.textContent || '').trim() || t.closest('[data-layer="content-notice"], [data-node="lens-win"]')) continue;
    for (const ln of (t.querySelectorAll('tspan').length ? t.querySelectorAll('tspan') : [t])) {
      if (!ln.textContent.trim()) continue;
      const b = ln.getBoundingClientRect();
      if (b.width < 2) continue;
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      if (occ.some(o => cx > o.left && cx < o.right && cy > o.top && cy < o.bottom)) continue;
      // (only this animation's own elements count: the test page stacks several slots)
      // (an element at zero opacity is still hit-tested: only visibly drawn ones count)
      const top = document.elementsFromPoint(cx, cy).find(e => svg.contains(e) && e !== svg && eff(e) > 0.05);
      n++;
      // (a text's own decoration — the strike-through of a struck value, drawn in the text's own group — is not a cover)
      const own = t.parentElement && t.parentElement.closest('[data-node]');
      if (!top || !(top === t || t.contains(top) || (top.tagName === 'line' && own && own.contains(top)))) ok = false;
    }
  }
  slot.setAttribute('style', keep);
  return ok && n > 0;
})()`;

/**
 * Rendered: no connector runs under (or over) text. Points sampled along the DRAWN part of every visible connector —
 * the threads (`-lk*-line`, drawn by their dash offset), the pointer (`-ptr`) and any `data-connector` path — never
 * fall inside a visible text line's box (each line shrunk by 1.5 px). Its own label's text is exempt (`own` lists
 * data-node prefixes whose text a connector may meet: none by default).
 */
export const CONNECTOR_OFF_TEXT = `(() => {
  ${EFF}
  const lines = [...svg.querySelectorAll('text')].filter(t => eff(t) >= 0.05 && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"], [data-node="lens-content"]')).flatMap(t => { const ts = [...t.querySelectorAll('tspan')]; const own = t.closest('[data-node^="rl"]'); const on = own ? (own.getAttribute('data-node').match(/^rl\\d+/) || [null])[0] : null; return (ts.length ? ts : [t]).filter(q => q.textContent.trim()).map(q => ({b: q.getBoundingClientRect(), own: on})); });
  const occ = [...svg.querySelectorAll('[data-occludes]')].filter(o => eff(o) > 0.05).map(o => o.getBoundingClientRect());
  const conns = [...svg.querySelectorAll('[data-node$="-ptr"], [data-node*="-lk"][data-node$="-line"], [data-node^="rel-c"][data-node$="-line"], [data-connector]')].filter(e => eff(e) > 0.05 && !e.closest('[data-node="lens-content"]'));
  const pts = [];
  for (const c of conns) {
    const m = c.getScreenCTM();
    if (c.tagName === 'line') {
      const a = ['x1', 'y1', 'x2', 'y2'].map(k => parseFloat(c.getAttribute(k)));
      for (let i = 0; i <= 40; i++) pts.push(new DOMPoint(a[0] + (a[2] - a[0]) * i / 40, a[1] + (a[3] - a[1]) * i / 40).matrixTransform(m));
      continue;
    }
    const L = c.getTotalLength();
    // (a dashed connector is drawn through its mask: the masker's dash offset says how much is drawn)
    const mk = c.getAttribute('mask') ? svg.querySelector('[data-node="' + c.getAttribute('data-node').replace(/-line$/, '-masker') + '"]') : null;
    const src = mk || c;
    const da = (src.getAttribute('stroke-dasharray') || '').split(/[ ,]+/).map(parseFloat);
    const off = parseFloat(src.getAttribute('stroke-dashoffset') || '0');
    // (a thread drawn by its dash offset: only its first L − offset is drawn)
    const drawn = da.length === 2 && da[0] >= L - 0.5 ? Math.max(0, L - off) : L;
    // (an edge label lying on its own connector is that connector's own text)
    const mine = (c.getAttribute('data-node').match(/^rel-c(\\d+)-line$/) || [])[1];
    for (let i = 0; i <= 60; i++) { const q = c.getPointAtLength(drawn * i / 60).matrixTransform(m); q.own = mine !== undefined ? 'rl' + mine : null; pts.push(q); }
  }
  const inOcc = q => occ.some(o => q.x > o.left && q.x < o.right && q.y > o.top && q.y < o.bottom);
  return pts.every(q => inOcc(q) || lines.every(({b, own}) => (q.own && own === q.own) || !(q.x > b.left + 1.5 && q.x < b.right - 1.5 && q.y > b.top + 1.5 && q.y < b.bottom - 1.5)));
})()`;

/**
 * Rendered: every standing figure (a person rig group `-pb` / `-pa` whose head is visible) is at least MIN px tall at
 * 1080p (head top to feet), so people stay readable as figures, not only as heads.
 */
export const figuresAtLeast = (min, sel = '[data-node$="-pb"]') => `(() => {
  ${K} ${EFF}
  const figs = [...svg.querySelectorAll(${JSON.stringify(sel)})].filter(e => eff(e) > 0.05 && !e.closest('[data-node="lens-content"]'));
  if (!figs.length) return false;
  return figs.every(f => f.getBoundingClientRect().height / K >= ${min});
})()`;

/**
 * Rendered: relation labels sit by their own connector. For every visible relation label chip (`rl<i>-chip`), its own
 * connector (`rel-c<i>-line`) is the nearest one to the chip, and every other visible connector is at least MIN px
 * (1080p) farther from the chip than its own.
 */
export const relationLabelsNearest = (min = 20) => `(() => {
  ${K} ${EFF}
  const labs = [...svg.querySelectorAll('[data-node^="rl"][data-node$="-chip"]')].filter(e => eff(e) > 0.3);
  const lines = new Map([...svg.querySelectorAll('[data-node^="rel-c"][data-node$="-line"]')].filter(e => eff(e) > 0.05).map(e => [e.getAttribute('data-node').match(/^rel-c(\\d+)-line$/)[1], e]));
  const dist = (b, ln) => { const m = ln.getScreenCTM(), L = ln.getTotalLength(); let d = Infinity; for (let i = 0; i <= 80; i++) { const q = ln.getPointAtLength(L * i / 80).matrixTransform(m); const dx = Math.max(b.left - q.x, 0, q.x - b.right), dy = Math.max(b.top - q.y, 0, q.y - b.bottom); d = Math.min(d, Math.hypot(dx, dy)); } return d; };
  if (!labs.length) return false;
  for (const lab of labs) {
    const i = lab.getAttribute('data-node').match(/^rl(\\d+)-chip$/)[1];
    const own = lines.get(i);
    if (!own) return false;
    const b = lab.getBoundingClientRect();
    const d0 = dist(b, own);
    for (const [j, ln] of lines) if (j !== i && dist(b, ln) < d0 + ${min} * K) return false;
  }
  return true;
})()`;

/** Rendered: with labels hidden no label text is drawn anywhere (only the harness content notice). */
export const NO_TEXT_HIDDEN = `(() => {
  ${EFF}
  return [...svg.querySelectorAll('text')].filter(t => (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]')).every(t => eff(t) < 0.05);
})()`;

/**
 * Banned words (legal, EN + ES): no amendment rule, permission, time limit, admissibility, approval or rejection and no
 * effect of amending is stated.
 */
export const BANNED = /\b(approv(e|es|ed|al)|reject(s|ed|ion)?|grant(s|ed)?|den(y|ies|ied)|refus(e|es|ed|al)|permission|leave\s+to\s+amend|deadline|time.limit|admissib(le|ility)|inadmissible|(in)?valid(ity)?|effects?|prevail(s|ed)?|wins?|loses?|aprobad[ao]s?|aprobaci[oó]n|rechazad[ao]s?|rechazo|concedid[ao]s?|denegad[ao]s?|permiso|autorizaci[oó]n|plazos?|admisible|inadmisible|admisibilidad|v[aá]lid[ao]s?|inv[aá]lid[ao]s?|efectos?|prevalece|gana|pierde)\b/i;
export const BANNED_TEXT = `(() => !${BANNED}.test([...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]')).map(t => t.textContent).join(' ').replace(/\\u00a0/g, ' ')))()`;

/**
 * Rendered: every drawn connector (`[data-from][data-to]` wrapper around `rel-c<i>`) ends within MAX px (1080p) of
 * the component it joins as drawn at this u — the component's group plus its label chip only while that chip is
 * visible (a chip shown only at the gather never counts before it appears).
 */
export const connectorEndsOnTarget = (max = 8) => `(() => {
  ${K} ${EFF}
  const boxOf = id => { const parts = [svg.querySelector('[data-node="el-' + id + '"]'), svg.querySelector('[data-node="el-' + id + '-labg"]')].filter(e => e && eff(e) > 0.05);
    if (!parts.length) return null; const rs = parts.map(e => e.getBoundingClientRect());
    return {L: Math.min(...rs.map(q => q.left)), T: Math.min(...rs.map(q => q.top)), R: Math.max(...rs.map(q => q.right)), B: Math.max(...rs.map(q => q.bottom))}; };
  const d = (p, b) => Math.hypot(Math.max(b.L - p.x, 0, p.x - b.R), Math.max(b.T - p.y, 0, p.y - b.B));
  const ws = [...svg.querySelectorAll('[data-from][data-to]')];
  if (!ws.length) return false;
  return ws.every(w => { const line = w.querySelector('[data-node$="-line"]'); if (!line || eff(line) < 0.05) return true;
    const L = line.getTotalLength(), m = line.getScreenCTM(); const ends = [line.getPointAtLength(0), line.getPointAtLength(L)].map(p => p.matrixTransform(m));
    const A = boxOf(w.dataset.from), B = boxOf(w.dataset.to); if (!A || !B) return false;
    return d(ends[0], A) / K <= ${max} && d(ends[1], B) / K <= ${max}; });
})()`;
