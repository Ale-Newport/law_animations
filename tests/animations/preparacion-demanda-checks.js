// Rendered-DOM checks shared by the "Preparación de demanda" tests (LAW-0245..0248).
// FACES_CLEAR … HEADS_OFF_TEXT, textSizeOverTime and baselineTextAtHold are copied unchanged from
// tests/animations/requerimiento-previo-checks.js (the civil-claim pilot, LAW-0241..0244): AUTHORING forbids importing
// helpers from another motif's test files. The checks after the copied block are new for this motif.
// Each export is the source of a DOM expression for tests/harness/ratio-checks.js (`svg` = the rendered root,
// `visible(el)` = no ancestor hidden), or a function that registers a Playwright test. Distances are converted to
// px at 1080p (the frame's short side is 1080 px).

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
  const tool = el => el.closest && el.closest('[data-node$="-pen"], [data-node$="-hand"]');
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
/* New checks for this motif                                                 */
/* ======================================================================== */

const FRAME = `const vb0 = svg.viewBox.baseVal, m0 = svg.getScreenCTM(); const q0 = new DOMPoint(vb0.x, vb0.y).matrixTransform(m0), q1 = new DOMPoint(vb0.x + vb0.width, vb0.y + vb0.height).matrixTransform(m0); const F = {left: q0.x, top: q0.y, right: q1.x, bottom: q1.y, width: q1.x - q0.x, height: q1.y - q0.y};`;

/**
 * Rendered: no arm (hand, forearm or upper arm) is drawn over visible text (every visible text is sampled on a 16 × 3
 * grid; at most 4 % of its points may have an arm stacked above it) — the brief's "no hands over faces or text".
 */
export const HANDS_OFF_TEXT = `(() => {
  ${EFF}
  svg.scrollIntoView({block: 'center', inline: 'center'});
  // (the whole arm counts — upper arm, forearm and hand — for both arms of every person)
  const hands = [...svg.querySelectorAll('[data-node$="-hand"], [data-node$="-pa-near"], [data-node$="-pa-far"]')].filter(e => eff(e) > 0.05 && !e.closest('[data-node="lens-content"]'));
  if (!hands.length) return true;
  const hb = hands.map(h => h.getBoundingClientRect());
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
      if (st.slice(0, upto).some(e => hands.some(h => h.contains(e)))) hit++;
    }
    if (hit / n > 0.04) return false;
  }
  return true;
})()`;

/**
 * Rendered: no tag, chip, callout or key (their chip bodies) lies over any drawn part of a prop or person, or over any
 * text it does not own. `props` = data-node names of prop groups (every visible drawn leaf inside them counts).
 */
export const labelsOffProps = props => `(() => { ${EFF}
 const R = e => e.getBoundingClientRect(); const meet = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1.5;
 const chips = [...svg.querySelectorAll('[data-node$="-chip"], [data-node^="chip-"], [data-node="key"], [data-node="hdr0"], [data-node="hdr1"]')].filter(e => eff(e) > 0.3);
 const groups = ${JSON.stringify(props)}.flatMap(n => [...svg.querySelectorAll('[data-node="' + n + '"]')]);
 const leaves = groups.flatMap(g0 => [...g0.querySelectorAll('path, rect, circle, ellipse, polygon, line, text')].filter(e => eff(e) > 0.3 && !e.closest('clipPath, defs')).map(e => Object.assign(e, {propName: g0.dataset.node})));
 const texts = [...svg.querySelectorAll('text')].filter(t => eff(t) > 0.3 && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]'));
 const out = [];
 for (const c of chips) { const b = R(c); for (const p of leaves) if (meet(b, R(p))) { out.push(c.dataset.node + '~' + p.propName); break; } for (const t of texts) if (!c.contains(t) && meet(b, R(t))) out.push(c.dataset.node + '~"' + t.textContent.slice(0, 16) + '"'); }
 return out.length === 0; })()`;

/** Rendered: the union box of the named content groups spans >= MINW of the frame's width (and >= MINH of its height). */
export const contentShare = (groups, minW, minH = 0) => `(() => { ${EFF} ${FRAME}
  const els = ${JSON.stringify(groups)}.flatMap(n => [...svg.querySelectorAll('[data-node="' + n + '"]')]).filter(e => eff(e) > 0.05);
  const leaves = els.flatMap(e => [...e.querySelectorAll('path, rect, circle, ellipse, text, line')]).filter(e => eff(e) > 0.05 && !e.closest('defs, clipPath'));
  const bs = leaves.map(e => e.getBoundingClientRect()).filter(b => b.width > 0.5 || b.height > 0.5);
  if (!bs.length) return false;
  const x0 = Math.min(...bs.map(b => b.left)), x1 = Math.max(...bs.map(b => b.right)), y0 = Math.min(...bs.map(b => b.top)), y1 = Math.max(...bs.map(b => b.bottom));
  return (x1 - x0) / F.width >= ${minW} && (y1 - y0) / F.height >= ${minH};
})()`;

/**
 * Coverage of the frame, sampled on a 40 × 40 grid: the share of grid points inside the union of the visible content
 * groups' boxes (the LAW-0228 measure). Registers a test asserting that no run with coverage < 0.3 lasts more than
 * 200 ms at 60 fps, in every preset × ratio × labels state; logs the minimum coverage and the rest/hold values.
 * @param {string} id
 * @param {{groups:string[], presets:any[], test:any, expect:any}} o
 */
export function coverageOverTime(id, o) {
  const {test, expect} = o;
  test(`${id}: RENDERED frame coverage — no run below 0.3 of the frame longer than 200 ms (60 fps, labels on and hidden)`, async ({page}) => {
    test.setTimeout(600000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const res = await page.evaluate(async ([id, ps, groups]) => {
      const def = await window.__lib.load(id);
      const out = [], info = [];
      for (const pr of ps) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const svg = x.element;
        const eff = e => { let q0 = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) q0 *= parseFloat(a); } return q0; };
        const vb = svg.viewBox.baseVal, m = svg.getScreenCTM();
        const F = {l: m.e + vb.x * m.a, t: m.f + vb.y * m.d, w: vb.width * m.a, h: vb.height * m.d};
        const frames = Math.round(x.durationMs / (1000 / 60));
        let run = 0, worst = 0, worstAt = 0, minCov = 1, rest = 0, hold = 0;
        for (let f = 0; f <= frames; f++) {
          x.seek((f / frames) * x.durationMs);
          const parts = groups.flatMap(n => [...svg.querySelectorAll('[data-node="' + n + '"]')]).filter(e => eff(e) >= 0.15).map(e => e.getBoundingClientRect()).filter(b => b.width > 1 && b.height > 1);
          let hit = 0;
          for (let a = 0; a < 40; a++) for (let b = 0; b < 40; b++) {
            const px = F.l + (a + 0.5) * F.w / 40, py = F.t + (b + 0.5) * F.h / 40;
            if (parts.some(r => px >= r.left && px <= r.right && py >= r.top && py <= r.bottom)) hit++;
          }
          const cov = hit / 1600;
          if (f === 0) rest = cov;
          if (f === frames) hold = cov;
          minCov = Math.min(minCov, cov);
          if (cov < 0.3) { run += 1000 / 60; if (run > worst) { worst = run; worstAt = f; } } else run = 0;
        }
        info.push(`${pr.name} ${tv} ${ratio}: coverage rest ${rest.toFixed(3)} hold ${hold.toFixed(3)} min ${minCov.toFixed(3)}; longest run < 0.3: ${Math.round(worst)} ms`);
        if (worst > 200) out.push(`${pr.name} ${tv} ${ratio}: ${Math.round(worst)} ms below 0.3 coverage (ending frame ${worstAt})`);
        x.destroy(); el.remove();
      }
      return {out, info};
    }, [id, o.presets, o.groups]);
    console.log(res.info.join('\n'));
    expect(res.out, res.out.join('\n')).toEqual([]);
  });
}

/**
 * Played forward at 60 fps from u = 0 vs a fresh instance seeked straight to u: the rendered SVG must be identical at
 * u = 0.45, 0.6, 0.8 and 1 in every preset × ratio (labels on and hidden) — the render never depends on seek history.
 */
export function playedVsSeek(id, o) {
  const {test, expect} = o;
  test(`${id}: RENDERED SVG played forward at 60 fps equals a fresh seek (u 0.45, 0.6, 0.8, 1)`, async ({page}) => {
    test.setTimeout(600000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const bad = await page.evaluate(async ([id, ps]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of ps) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const at = [0.45, 0.6, 0.8, 1];
        const played = {};
        {
          const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, instanceId: 'pvs', params: {...pr.params, textVisibility: tv}});
          await x.ready;
          const frames = Math.round(x.durationMs / (1000 / 60));
          for (let f = 0; f <= frames; f++) {
            x.renderFrame(f, {fps: 60});
            const u = +(f / frames).toFixed(4);
            for (const a of at) if (Math.abs(u - a) < 0.5 / frames) played[a] = x.element.innerHTML;
          }
          for (const a of at) if (!played[a]) { x.seek(a * x.durationMs); played[a] = x.element.innerHTML; }
          x.destroy(); el.remove();
        }
        for (const a of at) {
          const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, instanceId: 'pvs', params: {...pr.params, textVisibility: tv}});
          await x.ready;
          // the same time the played instance reached (frame f / 60 s)
          const frames = Math.round(x.durationMs / (1000 / 60));
          const f = Math.round(a * frames);
          x.renderFrame(f, {fps: 60});
          if (x.element.innerHTML !== played[a]) out.push(`${pr.name} ${tv} ${ratio} u=${a}`);
          x.destroy(); el.remove();
        }
      }
      return out;
    }, [id, o.presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * create() + ready measured COLD: one fresh page per preset × ratio (the module is imported first, then only
 * create() and readiness are timed). Must stay <= 1000 ms. Logs every measurement.
 */
export function coldCreate(id, o) {
  const {test, expect} = o;
  test(`${id}: COLD create() + ready <= 1 s in a fresh page (every preset × ratio)`, async ({browser}) => {
    test.setTimeout(600000);
    const rows = [];
    for (const pr of o.presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto('/tests/harness/host.html');
      await page.waitForFunction(() => document.body.dataset.ready === '1');
      const ms = await page.evaluate(async ([id, params, w, h]) => {
        const def = await window.__lib.load(id);
        await document.fonts.ready;
        const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
        const t0 = performance.now();
        const x = def.create(el, {width: w, height: h, params});
        await x.ready;
        x.seek(x.durationMs);
        const t1 = performance.now();
        x.destroy();
        return Math.round(t1 - t0);
      }, [id, pr.params, w, h]);
      rows.push({k: `${pr.name} ${ratio}`, ms});
      await ctx.close();
    }
    console.log(`${id} cold create: ` + rows.map(r => `${r.k} ${r.ms} ms`).join(' · '));
    for (const r of rows) expect.soft(r.ms, `cold create ${r.k}`).toBeLessThanOrEqual(1000);
  });
}

/** Rendered: head size (min of width/height, px at 1080p) of every visible stage head is at least MIN. */
export const headsPx = min => headsAtLeast(min);

/** Rendered: the leader / guide paths inside group NAME (every <path> without fill) cross no visible text outside that group. */
export const pathsOffText = name => `(() => { ${EFF}
  const grp = svg.querySelector('[data-node="' + name + '"]'); if (!grp || eff(grp) < 0.3) return true;
  const texts = [...svg.querySelectorAll('text')].filter(t => eff(t) > 0.3 && (t.textContent || '').trim() && !grp.contains(t) && !t.closest('[data-layer="content-notice"]')).map(t => t.getBoundingClientRect());
  for (const pth of grp.querySelectorAll('path')) {
    if ((pth.getAttribute('fill') || '') !== 'none' || !pth.getAttribute('stroke-dasharray')) continue;
    const L = pth.getTotalLength(), m = pth.getScreenCTM();
    for (let i = 1; i < 80; i++) { const q = pth.getPointAtLength(L * i / 80).matrixTransform(m); if (texts.some(b => q.x > b.left + 1 && q.x < b.right - 1 && q.y > b.top + 1 && q.y < b.bottom - 1)) return false; }
  }
  return true; })()`;

/**
 * Rendered, 60 fps: the longest run of frames in which an arm (hand, forearm or upper arm) is drawn over visible text
 * (the HANDS_OFF_TEXT measure) stays <= maxMs, in every preset × ratio with labels shown. Logs every non-zero run.
 * @param {string} id
 * @param {{presets:any[], maxMs:number, test:any, expect:any}} o
 */
export function armsOffTextOverTime(id, o) {
  const {test, expect} = o;
  test(`${id}: RENDERED arms over text — any crossing <= ${o.maxMs} ms (60 fps, every preset × ratio)`, async ({page}) => {
    test.setTimeout(900000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const res = await page.evaluate(async ([id, ps, expr]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of ps) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        const svg = x.element;
        const check = new Function('svg', `return (${expr});`);
        const frames = Math.round(x.durationMs / (1000 / 60));
        let run = 0, worst = 0, at = null;
        for (let f = 0; f <= frames; f++) {
          x.seek((f / frames) * x.durationMs);
          if (!check(svg)) { run++; if (run > worst) { worst = run; at = f / frames; } } else run = 0;
        }
        out.push({k: `${pr.name} ${ratio}`, ms: Math.round(worst * 1000 / 60), at});
        x.destroy && x.destroy(); el.remove();
      }
      return out;
    }, [id, o.presets, HANDS_OFF_TEXT]);
    console.log(`${id} arms over text (longest run): ` + res.map(r => `${r.k} ${r.ms} ms${r.ms ? ` @u ${r.at.toFixed(3)}` : ''}`).join(' · '));
    const bad = res.filter(r => r.ms > o.maxMs).map(r => `${r.k}: ${r.ms} ms`);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/** Rendered: every visible leader line (…-lead) is shown only while its own chip (…-chip) is visible too. */
export const LEADS_WITH_CHIPS = `(() => {
  ${EFF}
  for (const lead of svg.querySelectorAll('[data-node$="-lead"]')) {
    if (eff(lead) < 0.3) continue;
    const chip = svg.querySelector('[data-node="' + lead.getAttribute('data-node').replace(/-lead$/, '-chip') + '"]');
    if (chip && eff(chip) < 0.3) return false;
  }
  return true;
})()`;

/**
 * Rendered: no wrapped text breaks a token — no line ends with a hyphen that continues a reference on the next line
 * ("CF-2024-000520- / AB") and no continuation line holds only 1–2 characters.
 */
export const NO_SPLIT_TOKENS = `(() => {
  ${EFF}
  for (const t of svg.querySelectorAll('text')) {
    if (eff(t) < 0.3) continue;
    const lines = [...t.querySelectorAll('tspan')].map(s => (s.textContent || '').trim()).filter(Boolean);
    for (let i = 1; i < lines.length; i++) {
      if (/[-‐‑]$/.test(lines[i - 1]) && /^[\\p{L}\\p{N}]/u.test(lines[i])) return false;
      if (lines[i].length <= 2 && !/^\\d+$/.test(lines[i])) return false;
    }
  }
  return true;
})()`;
