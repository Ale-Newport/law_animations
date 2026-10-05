// Rendered-DOM checks shared by the four "Apertura de audiencia" entries (LAW-0281..0284, hearings pilot).
// Every size and share is measured on the RENDERED DOM at 1080p (getBoundingClientRect / getScreenCTM × computed
// font size), in every preset × ratio (AUTHORING items 1, 8, 10–12, 17, 19, 20; lens rules at line 109). Each test
// also prints the extreme rendered values it measured (console, prefixed "[hearings-01]") so reports quote rendered
// numbers, not layout-model estimates. Floors are the standing ones (AUTHORING + production/SESSION_HANDOFF.md
// "STANDING PEOPLE FLOORS"); none is lowered here.
import {test, expect} from '@playwright/test';
import {presetsFor} from '../harness/contract.js';

export const RATIOS = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];
export const BASELINES = ['default', 'baseline-illustrative', 'baseline-es'];

// In-page helpers (serialised into page.evaluate): effective opacity, boxes, texts, people.
export const HELPERS = `
  const eff = (svg, e) => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null && a !== undefined && a !== '') o *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return o; };
  const box = e => { const b = e.getBoundingClientRect(); return {l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height}; };
  const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;
  const texts = (svg, minOp = 0.05) => [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]') && (t.textContent || '').trim() && eff(svg, t) >= minOp && t.getBoundingClientRect().width > 0.5);
  const node = (svg, n) => svg.querySelector('[data-node="' + n + '"]');
  const nodes = (svg, re) => [...svg.querySelectorAll('[data-node]')].filter(e => re.test(e.getAttribute('data-node')));
  // screen px per 1080p px (the svg keeps its aspect inside any slot: use its CTM, not its element box)
  const px1080 = (svg, w, h) => svg.getScreenCTM().a * Math.min(w, h) / 1080;
  // a plan person is 100 template units across the shoulders: its rendered size in px at 1080p
  const personPx = (svg, e, w, h) => { const m = e.getScreenCTM(); return 100 * Math.hypot(m.a, m.b) / px1080(svg, w, h); };
  // the arm (a 21-unit-wide stroke) of a plan person as sampled discs in screen px
  const armDiscs = (arm) => { const m = arm.getScreenCTM(); const s = Math.hypot(m.a, m.b); const A = new DOMPoint(+arm.getAttribute('x1'), +arm.getAttribute('y1')).matrixTransform(m), B = new DOMPoint(+arm.getAttribute('x2'), +arm.getAttribute('y2')).matrixTransform(m); const L = Math.hypot(B.x - A.x, B.y - A.y); const n = Math.max(2, Math.ceil(L / 3)); return Array.from({length: n + 1}, (_, i) => ({x: A.x + (B.x - A.x) * i / n, y: A.y + (B.y - A.y) * i / n, r: 10.5 * s})); };
  // a plan head as its skull circle (rotation-invariant): centre and radius in screen px
  const headCircle = hd => { const c = [...hd.querySelectorAll('circle')].find(q => Math.abs(+q.getAttribute('r') - 21) < 0.01) || hd.querySelector('circle'); const m = c.getScreenCTM(); const p = new DOMPoint(+c.getAttribute('cx'), +c.getAttribute('cy')).matrixTransform(m); return {x: p.x, y: p.y, r: +c.getAttribute('r') * Math.hypot(m.a, m.b)}; };
  // distance (screen px) from a screen point to an element's own local bbox (exact for rotated rectangles)
  const localDist = (el, p) => { const bb = el.getBBox(); const m = el.getScreenCTM(); const q = new DOMPoint(p.x, p.y).matrixTransform(m.inverse()); const s = Math.hypot(m.a, m.b); return s * Math.hypot(Math.max(bb.x - q.x, 0, q.x - (bb.x + bb.width)), Math.max(bb.y - q.y, 0, q.y - (bb.y + bb.height))); };
  const discHits = (d, b, pad = 0.5) => { const dx = Math.max(b.l - d.x, 0, d.x - b.r), dy = Math.max(b.t - d.y, 0, d.y - b.b); return Math.hypot(dx, dy) < d.r - pad; };
`;

/** Run `fn` (an async body) for every preset × ratio (× labels hidden) in one page; collect its returned strings. */
export async function forAll(page, ID, fn, arg, {withHidden = false, presets: only = null, ratios = RATIOS} = {}) {
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
      el.className = 'slot';
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
  }, [ID, presets, ratios, fn, arg, withHidden, HELPERS]);
}

export const report = (ID, name, stats) => console.log(`[hearings-01] ${ID} ${name}: ${JSON.stringify(stats)}`);

/** Every visible text >= 19.5 px (default/baseline/baseline-es) / >= 16 px (other presets) at 1080p at EVERY sampled u. */
export function textFloorTest(ID, {step = 0.01} = {}) {
  test(`${ID}: every visible text >= 19.5 px in default/baseline/baseline-es and >= 16 px elsewhere, at every u (step ${step})`, async ({page}) => {
    test.setTimeout(900000);
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

/** No visible text (and no listed element) extends past the frame at any u. */
export function inFrameTest(ID, {step = 0.01, clipped = []} = {}) {
  test(`${ID}: no visible text, chip or listed element extends past the frame at any u (step ${step})`, async ({page}) => {
    test.setTimeout(900000);
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
 * their own, at every sampled u (opacity >= 0.3). `opaque` selectors are occluding overlays (a lens window).
 */
export function noOverlapTest(ID, {step = 0.01, markers = [], opaque = [], pad = 1} = {}) {
  test(`${ID}: texts never overlap, and markers/chips/props never cover a text, at every u (step ${step})`, async ({page}) => {
    test.setTimeout(900000);
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
          // a hollow outline (fill none: a ring, a frame) only covers what its stroke band crosses
          const leaves = m.querySelector('rect, path, circle, ellipse, line') ? [...m.querySelectorAll('rect, path, circle, ellipse, line')] : [m];
          const covers = t => leaves.some(q => {
            if (eff(svg, q) < 0.3) return false;
            const qb = box(q), tb = box(t);
            if (!hit(qb, tb, arg.pad)) return false;
            if ((q.getAttribute('fill') || '') !== 'none') return true;
            const sw = (parseFloat(q.getAttribute('stroke-width')) || 2) * Math.hypot(q.getScreenCTM().a, q.getScreenCTM().b) / 2 + 1;
            const inner = {l: qb.l + sw * 2, t: qb.t + sw * 2, r: qb.r - sw * 2, b: qb.b - sw * 2};
            return !(tb.l >= inner.l && tb.r <= inner.r && tb.t >= inner.t && tb.b <= inner.b);
          });
          for (const t of T) if (!m.contains(t) && (m.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_PRECEDING) && covers(t)) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': ' + sel + ' covers "' + t.textContent.slice(0, 18) + '"');
        }
      }
      return out;`, {step, markers, opaque, pad}, {withHidden: true});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/** create() <= 1 s COLD (a fresh page per preset × ratio). */
export function coldCreateTest(ID) {
  test(`${ID}: cold create() <= 1 s in every preset × ratio (fresh page each)`, async ({browser}) => {
    test.setTimeout(400000);
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const slow = [];
    let worst = 0, worstAt = '';
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
      if (ms > worst) { worst = ms; worstAt = `${pr.name} ${ratio}`; }
      if (ms > 1000) slow.push(`${pr.name} ${ratio}: ${Math.round(ms)} ms`);
      await page.close();
    }
    report(ID, 'cold create worst ms', {worst: Math.round(worst), at: worstAt});
    expect(slow, slow.join('\n')).toEqual([]);
  });
}

/**
 * Plan people (data-node names matching `re`) are >= min px across (1080p) at every sampled u; inside the `lens`
 * window [u0, u1] the floor for CONTEXT people is lensMin. Labels shown and hidden. `presetsMin` may name a stricter
 * or other standing floor for given presets/ratios (e.g. contrast 1:1 >= 55 baseline / >= 45 stress).
 */
export function peopleSizeTest(ID, {re = '^rm-p\\d$', min = 60, lensMin = 45, lens = null, step = 0.02, floorFor = null}) {
  test(`${ID}: people >= ${min} px across${lens ? ` (context people >= ${lensMin} px while the lens is open)` : ''} at every u (step ${step}), labels shown and hidden`, async ({page}) => {
    test.setTimeout(900000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      const RE = new RegExp(arg.re);
      const floorOf = arg.floorFor ? new Function('preset', 'ratio', 'inLens', arg.floorFor) : null;
      for (let u = 0; u <= 1.0001; u += arg.step) {
        x.seek(u * x.durationMs);
        const inLens = arg.lens && u >= arg.lens[0] && u <= arg.lens[1];
        for (const e of nodes(svg, RE)) {
          if (eff(svg, e) < 0.05) continue;
          const across = personPx(svg, e, w, h);
          stat((inLens ? 'lens ' : 'rest ') + ratio, Math.round(across * 10) / 10);
          const floor = floorOf ? floorOf(pr.name, ratio, inLens) : inLens ? arg.lensMin : arg.min;
          if (across < floor - 0.05) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': ' + e.getAttribute('data-node') + ' ' + across.toFixed(1) + ' px < ' + floor);
        }
      }
      return out;`, {re, min, lensMin, lens, step, floorFor}, {withHidden: true});
    report(ID, 'min person px', stats);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/** Heads (plan heads, data-node ...-head) never lie under a chip, tag, card body or marker (listed selectors). */
export function headsClearTest(ID, {heads = '^rm-p\\d-head$', covers = [], step = 0.02} = {}) {
  test(`${ID}: no chip, tag, marker or lens covers a head at any u (step ${step}), labels shown and hidden`, async ({page}) => {
    test.setTimeout(900000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      const RE = new RegExp(arg.heads);
      for (let u = 0; u <= 1.0001; u += arg.step) {
        x.seek(u * x.durationMs);
        const hs = nodes(svg, RE).filter(e => eff(svg, e) > 0.3).map(e => ({n: e.getAttribute('data-node'), e, c: headCircle(e)}));
        for (const sel of arg.covers) for (const c of svg.querySelectorAll(sel)) {
          if (eff(svg, c) < 0.3) continue;
          const leaves = c.querySelector('rect, path, circle, ellipse, text') ? [...c.querySelectorAll('rect, path, circle, ellipse, text')].filter(q => eff(svg, q) >= 0.3) : [c];
          // a stroked, unfilled path (a guide, a connector) covers only what its stroke passes over: sample it
          const strokeHit = (q, hc) => {
            if (!(q.tagName === 'path' || q.tagName === 'line' || q.tagName === 'polyline') || (q.getAttribute('fill') || '') !== 'none' || !q.getTotalLength) return null;
            const m = q.getScreenCTM(); const sw = (parseFloat(q.getAttribute('stroke-width')) || 2) * Math.hypot(m.a, m.b) / 2;
            const L = q.getTotalLength();
            for (let t = 0; t <= L; t += 2) { const p0 = q.getPointAtLength(t); const p = new DOMPoint(p0.x, p0.y).matrixTransform(m); if (Math.hypot(p.x - hc.x, p.y - hc.y) < hc.r + sw - 1) return true; }
            return false;
          };
          for (const hd of hs) {
            if (c.contains(hd.e)) continue;
            if (leaves.some(q => { const sh = strokeHit(q, hd.c); return sh === null ? localDist(q, hd.c) < hd.c.r - 1 : sh; })) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': ' + (c.getAttribute('data-node') || sel) + ' over ' + hd.n);
          }
        }
      }
      return out;`, {heads, covers, step}, {withHidden: true});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Limbs: no ARM (the whole 21-unit sleeve from shoulder to hand, sampled as discs) of a plan person lies over a
 * visible text, a chip body, another person's head or a listed prop (paper sheets, other cards, exhibits, tray,
 * display, switch, clock) at any u. The arm's own card (while it is being carried) is exempt.
 */
export function limbsClearTest(ID, {people = '^rm-p(\\d)$', props = [], step = 0.01} = {}) {
  test(`${ID}: no arm covers a text, a chip, a head or a prop at any u (step ${step}), labels shown and hidden`, async ({page}) => {
    test.setTimeout(900000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      const RE = new RegExp(arg.people);
      for (let u = 0; u <= 1.0001; u += arg.step) {
        x.seek(u * x.durationMs);
        const ppl = nodes(svg, RE).filter(e => eff(svg, e) > 0.3);
        const T = texts(svg, 0.3).map(box);
        const chips = [...svg.querySelectorAll('[data-node$="-body"]')].filter(e => eff(svg, e) > 0.3).map(box);
        for (const p of ppl) {
          const nm = p.getAttribute('data-node');
          const idx = nm.match(RE)[1];
          const prefix = nm.slice(0, nm.length - idx.length - 1);
          const heads = ppl.filter(q => q !== p).map(q => node(svg, q.getAttribute('data-node') + '-head')).filter(Boolean).map(box);
          const own = nm.replace(/p(\\d)$/, 'card$1');
          const propEls = arg.props.flatMap(sel => [...svg.querySelectorAll(sel)]).filter(e => eff(svg, e) > 0.3 && !(e.getAttribute('data-node') || '').startsWith(own));
          for (const arm of ['armL', 'armR']) {
            const a = node(svg, nm + '-' + arm + '-o');
            if (!a) continue;
            const ds = armDiscs(a);
            const tag = pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': ' + nm + ' ' + arm;
            if (ds.some(d => T.some(b => discHits(d, b)))) out.push(tag + ' over a text');
            if (ds.some(d => chips.some(b => discHits(d, b)))) out.push(tag + ' over a chip');
            if (ds.some(d => heads.some(b => discHits(d, b)))) out.push(tag + ' over another head');
            for (const pe of propEls) { const leaves = pe.querySelector('rect, path, circle, ellipse') ? [...pe.querySelectorAll('rect, path, circle, ellipse')].filter(q => eff(svg, q) >= 0.3) : [pe]; if (ds.some(d => leaves.some(q => localDist(q, d) < d.r - 1))) out.push(tag + ' over ' + pe.getAttribute('data-node')); }
          }
        }
      }
      return out;`, {people, props, step}, {withHidden: true});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Participant chips own their participant: each visible chip body lies within `maxGap` px (1080p) of its own person,
 * its leader ends on that person and crosses no other text, chip or head, and it is nearer its own person than any
 * other person (owner rule). Chips never lie over the table or over another person.
 */
export function chipsOwnTest(ID, {chipRe = '^lab(\\d)$', personOf = "'rm-p' + i", at = [1], maxGap = 80, table = 'rm-table', presets = null} = {}) {
  test(`${ID}: each label chip is attached to its own participant (leader lands, owner rule, off the table and people)`, async ({page}) => {
    test.setTimeout(600000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      const RE = new RegExp(arg.chipRe);
      const personOf = new Function('i', 'return ' + arg.personOf);
      for (const u of arg.at) {
        x.seek(u * x.durationMs);
        const k = px1080(svg, w, h);
        const people = nodes(svg, /^rm-p\\d$/).map(e => ({n: e.getAttribute('data-node'), e, hc: headCircle(e.querySelector('[data-node$="-head"]')), c: (() => { const m = e.getScreenCTM(); return {x: m.e, y: m.f, r: 50 * Math.hypot(m.a, m.b)}; })()}));
        const texts0 = texts(svg, 0.3);
        const tb = node(svg, arg.table);
        for (const ch of nodes(svg, RE).filter(e => eff(svg, e) > 0.5)) {
          const i = ch.getAttribute('data-node').match(RE)[1];
          const body = box(node(svg, ch.getAttribute('data-node') + '-body'));
          const own = people.find(q => q.n === personOf(i));
          if (!own) { out.push(pr.name + ' ' + ratio + ': no person for ' + ch.getAttribute('data-node')); continue; }
          const dist = q => Math.hypot(Math.max(body.l - q.x, 0, q.x - body.r), Math.max(body.t - q.y, 0, q.y - body.b));
          const d0 = dist(own.c);
          const gap = Math.max(0, d0 - own.c.r) / k;
          stat('max chip gap px (from the shoulders) ' + ratio, Math.round(gap), 'max');
          if (gap > arg.maxGap) out.push(pr.name + ' ' + ratio + ': ' + ch.getAttribute('data-node') + ' is ' + Math.round(gap) + ' px from its person');
          for (const q of people) if (q !== own && dist(q.c) <= d0 + 2) out.push(pr.name + ' ' + ratio + ': ' + ch.getAttribute('data-node') + ' is as near ' + q.n + ' as its own person');
          for (const q of people) if (dist(q.hc) < q.hc.r) out.push(pr.name + ' ' + ratio + ': ' + ch.getAttribute('data-node') + ' covers the head of ' + q.n);
          for (const q of people) if (dist(q.c) < q.c.r * 0.9) out.push(pr.name + ' ' + ratio + ': ' + ch.getAttribute('data-node') + ' covers ' + q.n);
          const lead = node(svg, ch.getAttribute('data-node') + '-lead');
          if (lead) {
            const m = lead.getScreenCTM();
            const A = new DOMPoint(+lead.getAttribute('x1'), +lead.getAttribute('y1')).matrixTransform(m), B = new DOMPoint(+lead.getAttribute('x2'), +lead.getAttribute('y2')).matrixTransform(m);
            const pe = svg.querySelector('[data-node="' + own.n + '"]').getBoundingClientRect();
            if (!(B.x >= pe.left - 2 && B.x <= pe.right + 2 && B.y >= pe.top - 2 && B.y <= pe.bottom + 2)) out.push(pr.name + ' ' + ratio + ': leader of ' + ch.getAttribute('data-node') + ' does not land on its person');
            const others = [...texts0.filter(t => !ch.contains(t)).map(box), ...people.filter(q => q !== own).map(q => ({l: q.hc.x - q.hc.r, r: q.hc.x + q.hc.r, t: q.hc.y - q.hc.r, b: q.hc.y + q.hc.r}))];
            for (let j = 1; j < 12; j++) { const q = {x: A.x + (B.x - A.x) * j / 12, y: A.y + (B.y - A.y) * j / 12}; if (others.some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b)) { out.push(pr.name + ' ' + ratio + ': leader of ' + ch.getAttribute('data-node') + ' crosses a text or head'); break; } }
          }
          if (tb) {
            // the chip stays off the oval table (test its ellipse on the rendered box)
            const el = tb.querySelector('ellipse:nth-of-type(2)') || tb.querySelector('ellipse');
            const m = el.getScreenCTM();
            const c = new DOMPoint(+el.getAttribute('cx'), +el.getAttribute('cy')).matrixTransform(m);
            const ra = +el.getAttribute('rx') * Math.hypot(m.a, m.b), rb = +el.getAttribute('ry') * Math.hypot(m.c, m.d);
            let on = false;
            for (let a = 0; a <= 8 && !on; a++) for (let b = 0; b <= 8 && !on; b++) { const px = body.l + body.w * a / 8, py = body.t + body.h * b / 8; if (((px - c.x) / ra) ** 2 + ((py - c.y) / rb) ** 2 < 1) on = true; }
            if (on) out.push(pr.name + ' ' + ratio + ': ' + ch.getAttribute('data-node') + ' lies over the table');
          }
        }
      }
      return out;`, {chipRe, personOf, at, maxGap, table}, {presets});
    report(ID, 'chip gaps', stats);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/** Equal visual weight of the ● / ◆ pair (and of paired chips): same ink area, fill, opacity; no dashes in the cue. */
export function equalWeightTest(ID, {chips = [], marks = [], at = [0, 0.5, 1], tag = ''}) {
  test(`${ID}: ● and ◆ (and paired chips) get equal visual weight — type, stroke, opacity, marker ink area${tag}`, async ({page}) => {
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
          // ink area: a circle is π r², a diamond half its box
          const ink = e => { const q = box(e); return e.tagName === 'circle' ? Math.PI * (q.w / 2) * (q.h / 2) : q.w * q.h / 2; };
          const ra = ink(A), rb = ink(B);
          if (ra > 0 && rb > 0 && Math.max(ra, rb) / Math.min(ra, rb) > 1.1) out.push(tag + ' u=' + u + ': marker ink areas ' + ra.toFixed(0) + ' vs ' + rb.toFixed(0));
          if (A.getAttribute('fill') !== B.getAttribute('fill')) out.push(tag + ': marker fill differs');
          if (A.getAttribute('stroke-dasharray') || B.getAttribute('stroke-dasharray')) out.push(tag + ': dashed marker');
        }
      }
      return out;`, {chips, marks, at});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Legal wording and marks: no visible text invents hearing procedure (opening formulas, "in session" ritual, calls to
 * order, mandatory steps, who speaks first, ranks, consequences of pending, verdicts, time limits); no red accent
 * anywhere in the scene; dashed strokes only on elements marked as pending (data-pending); a draw-on stroke
 * (data-draw: a dash pattern of one full-length dash, rendered solid) is not a dash.
 */
export function neutralityTest(ID, {dashOk = []} = {}) {
  test(`${ID}: no invented procedure in the text; no red accent; dashes only where something is pending`, async ({page}) => {
    test.setTimeout(400000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      const re = /(in session|se abre la sesi|queda abierta|declaro abiert|all rise|en pie|oyez|call(ed)? to order|orden del d[ií]a|must|debe[rn]?\\b|obligatori|mandatory|required|requisit|first to speak|speaks first|habla primero|turno de palabra|presid\\w*|chair(man|person)?\\b|judge|juez|magistrad|tribunal|court\\b|rank|jerarqu|superior|inferior|penalt|sanci|sanction|default\\b|rebeld|contumac|nulid|nullit|void\\b|inadmis|dismiss|desestim|verdict|veredicto|fallo|sentencia|guilt|culpab|valid\\w*|v[aá]lid\\w*|deadline|plazo|time limit|due\\b|late\\b|tarde\\b|delay|retras|minutes?\\b|minutos?|hours?\\b|horas?\\b)/i;
      const reds = ['#c8553d', '#d1495b', '#b5543c', '#9c4f4f'];
      for (const u of [0, 0.2, 0.35, 0.5, 0.75, 1]) {
        x.seek(u * x.durationMs);
        for (const t of texts(svg, 0.05)) if (re.test(t.textContent)) out.push(pr.name + ' ' + ratio + ': "' + t.textContent.slice(0, 50) + '"');
        const scene = svg.querySelector('[data-layer="scene"]');
        for (const e of scene.querySelectorAll('*')) {
          if (e.closest('mask, clipPath, defs')) continue;
          if (eff(svg, e) < 0.05) continue;
          const nm = e.getAttribute('data-node') || '';
          if (e.getAttribute('stroke-dasharray') && !e.hasAttribute('data-draw') && !arg.dashOk.some(re2 => new RegExp(re2).test(nm)) && !e.closest('[data-pending]')) out.push(pr.name + ' ' + ratio + ' u=' + u + ': dashed ' + (nm || e.tagName));
          const f = (e.getAttribute('fill') || '').toLowerCase(), s = (e.getAttribute('stroke') || '').toLowerCase();
          if (reds.includes(f) || reds.includes(s)) out.push(pr.name + ' ' + ratio + ' u=' + u + ': red accent on ' + (nm || e.tagName));
        }
      }
      return out;`, {dashOk}, {withHidden: true});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/** No directed arrowheads (marker-end / arrow paths) anywhere in the scene. */
export function noArrowsTest(ID) {
  test(`${ID}: no directed institutional arrows (no marker-end / arrowheads) in any preset × ratio`, async ({page}) => {
    test.setTimeout(300000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      for (const u of [0.3, 0.6, 1]) {
        x.seek(u * x.durationMs);
        for (const e of svg.querySelectorAll('[marker-end], [marker-start], marker, [data-node*="arrow"]')) if (!e.closest('[data-layer="content-notice"]')) out.push(pr.name + ' ' + ratio + ': ' + (e.getAttribute('data-node') || e.tagName));
      }
      return out;`, {});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Seek-history independence: the SVG played forward at 60 fps from 0 equals the SVG of a fresh instance seeked
 * directly, and of an instance seeked BACKWARD from the end, at each listed u (every preset × ratio, labels shown
 * and hidden). Same instanceId for all.
 */
export function seekHistoryTest(ID, {at = [0.3, 0.5, 0.75, 1]} = {}) {
  test(`${ID}: played forward at 60 fps = fresh seek = backward seek (SVG markup) at u ${at.join(', ')}`, async ({page}) => {
    test.setTimeout(900000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const out = await page.evaluate(async ([id, presets, ratios, at]) => {
      const def = await window.__lib.load(id);
      const bad = [];
      let compared = 0;
      const make = async (params, w, h) => {
        const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, instanceId: 'seekcmp', params});
        await x.ready;
        return {x, el, done: () => { x.destroy(); el.remove(); }};
      };
      for (const pr of presets) for (const tv of [null, 'none']) for (const [ratio, w, h] of ratios) {
        const params = tv ? {...pr.params, textVisibility: tv} : pr.params;
        const A = {}, B = {}, C = {};
        {
          const {x, done} = await make(params, w, h);
          let ms = 0;
          for (const u of at) {
            const end = u * x.durationMs;
            for (; ms < end - 1e-6; ms += 1000 / 60) x.seek(ms);
            x.seek(end);
            A[u] = x.element.outerHTML;
          }
          done();
        }
        for (const u of at) {
          const {x, done} = await make(params, w, h);
          x.seek(u * x.durationMs);
          B[u] = x.element.outerHTML;
          done();
        }
        {
          const {x, done} = await make(params, w, h);
          let ms = x.durationMs;
          for (const u of [...at].reverse()) {
            const end = u * x.durationMs;
            for (; ms > end + 1e-6; ms -= 1000 / 60) x.seek(ms);
            x.seek(end);
            C[u] = x.element.outerHTML;
          }
          done();
        }
        for (const u of at) {
          compared++;
          for (const [nm, Z] of [['fresh', B], ['backward', C]]) {
            if (A[u] !== Z[u]) {
              let i = 0; while (i < A[u].length && A[u][i] === Z[u][i]) i++;
              bad.push(`${pr.name}${tv ? ' (labels hidden)' : ''} ${ratio} u=${u} forward vs ${nm}: differs at ${i}: …${A[u].slice(Math.max(0, i - 80), i + 60)}… vs …${Z[u].slice(Math.max(0, i - 80), i + 60)}…`);
            }
          }
        }
      }
      return {bad, compared};
    }, [ID, presets, RATIOS, at]);
    console.log(`[hearings-01] ${ID} seek-history: ${out.compared} comparisons (×2: fresh and backward), ${out.bad.length} differ`);
    expect(out.compared).toBeGreaterThan(20);
    expect(out.bad.slice(0, 6), out.bad.slice(0, 6).join('\n')).toEqual([]);
  });
}

// Content extent: the union of the visible named leaf nodes' boxes (the content notice excluded), in viewBox units.
const CONTENT = `
  const vbx = svg.viewBox.baseVal; const inv = svg.getScreenCTM().inverse();
  const toV = r0 => { const a = new DOMPoint(r0.left, r0.top).matrixTransform(inv), b = new DOMPoint(r0.right, r0.bottom).matrixTransform(inv); return {x0: a.x, y0: a.y, x1: b.x, y1: b.y}; };
  let leaves = null;
  const content = () => { if (!leaves) leaves = [...svg.querySelectorAll('[data-node]')].filter(e => !e.closest('[data-layer="content-notice"]') && !e.querySelector('[data-node]'));
    let U = null; for (const e of leaves) { if (eff(svg, e) < 0.05) continue; const r0 = e.getBoundingClientRect(); if (r0.width < 1 || r0.height < 1) continue; const q = toV(r0); U = U ? {x0: Math.min(U.x0, q.x0), y0: Math.min(U.y0, q.y0), x1: Math.max(U.x1, q.x1), y1: Math.max(U.y1, q.y1)} : q; }
    if (!U) return {w: 0, h: 0, a: 0};
    const x0 = Math.max(U.x0, vbx.x), y0 = Math.max(U.y0, vbx.y), x1 = Math.min(U.x1, vbx.x + vbx.width), y1 = Math.min(U.y1, vbx.y + vbx.height);
    return {w: (x1 - x0) / vbx.width, h: (y1 - y0) / vbx.height, a: ((x1 - x0) * (y1 - y0)) / (vbx.width * vbx.height)}; };
`;

/**
 * AUTHORING item 11, measured on the RENDERED content (union of the visible nodes): at rest, build and hold, labels
 * shown AND hidden, the content covers more than half of the caption-safe box area (0.88 × 0.74 of the frame).
 * Also reports the subject share of the frame height (the SUBJECT selector's box ≥ 0.20 of the frame height).
 */
export function fillMostTest(ID, {at = [0.05, 0.5, 1], share = 0.5, subject = null, subjectMin = 0.2} = {}) {
  test(`${ID}: content fills > ${share} of the caption-safe box at rest, build and hold (labels shown and hidden); subject >= ${subjectMin} of the frame height`, async ({page}) => {
    test.setTimeout(400000);
    const {bad, stats} = await forAll(page, ID, `${CONTENT}
      const out = [];
      for (const u of arg.at) {
        x.seek(u * x.durationMs);
        const c = content(); const sh = c.a / (0.88 * 0.74);
        stat('min fill share ' + ratio, Math.round(sh * 100) / 100);
        if (sh <= arg.share) out.push(pr.name + ' ' + ratio + ' u=' + u + ': content ' + c.w.toFixed(3) + ' x ' + c.h.toFixed(3) + ' of the frame = ' + sh.toFixed(2) + ' of the safe box');
        if (arg.subject) {
          const F = svg.getBoundingClientRect();
          for (const s of svg.querySelectorAll(arg.subject)) { if (eff(svg, s) < 0.3) continue; const hh = s.getBoundingClientRect().height / F.height; stat('min subject h ' + ratio, Math.round(hh * 1000) / 1000); if (hh < arg.subjectMin) out.push(pr.name + ' ' + ratio + ' u=' + u + ': subject ' + hh.toFixed(3) + ' of the frame height'); }
        }
      }
      return out;`, {at, share, subject, subjectMin}, {withHidden: true});
    report(ID, 'fill', stats);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/** No empty transitions (item 19): at 60 fps no stretch > limitMs where the visible content covers < share of the frame. */
export function thinContentTest(ID, {limitMs = 200, share = 0.3} = {}) {
  test(`${ID}: no stretch > ${limitMs} ms with content < ${share} of the frame (60 fps, labels shown and hidden)`, async ({page}) => {
    test.setTimeout(900000);
    const {bad, stats} = await forAll(page, ID, `${CONTENT}
      const out = [];
      let run = 0, worst = 0, at = 0, minA = 1;
      for (let ms = 0; ms <= x.durationMs + 1e-6; ms += 1000 / 60) { x.seek(ms); const c = content(); minA = Math.min(minA, c.a); run = c.a < arg.share ? run + 1000 / 60 : 0; if (run > worst) { worst = run; at = ms; } }
      stat('min content share ' + ratio, Math.round(minA * 100) / 100);
      if (worst > arg.limitMs) out.push(pr.name + ' ' + ratio + ': content < ' + arg.share + ' of the frame for ' + Math.round(worst) + ' ms (ending ' + Math.round(at) + ' ms)');
      return out;`, {limitMs, share}, {withHidden: true});
    report(ID, 'thin content', stats);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Localisation (es): with ONLY locale 'es' set (English defaults), no built-in or default text is English. The
 * listed English words must not appear in any visible text at the hold.
 */
export function esDefaultsTest(ID, {words = ['Participant', 'Session', 'Exhibit', 'Room', 'Written', 'fictional', 'supplied', 'Sequence', 'Wall', 'card', 'lights', 'configured', 'conclusion', 'label']} = {}) {
  test(`${ID}: locale 'es' alone localises every default text (no English leaks)`, async ({page}) => {
    test.setTimeout(300000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const bad = await page.evaluate(async ([id, ratios, words]) => {
      const def = await window.__lib.load(id);
      const eff = (svg, e) => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null && a !== undefined && a !== '') o *= parseFloat(a); } return o; };
      const texts = (svg, minOp) => [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]') && (t.textContent || '').trim() && eff(svg, t) >= minOp);
      const out = [];
      for (const [ratio, w, h] of ratios) for (const u of [0.1, 0.5, 1]) {
        const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {locale: 'es'}});
        await x.ready;
        x.seek(u * x.durationMs);
        for (const t of texts(x.element, 0.05)) for (const wd of words) if (new RegExp('\\b' + wd + '\\b').test(t.textContent)) out.push(ratio + ' u=' + u + ': "' + t.textContent.slice(0, 40) + '" contains ' + wd);
        x.destroy(); el.remove();
      }
      return [...new Set(out)];
    }, [ID, RATIOS, words]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}
