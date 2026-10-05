// LAW-0445 — Aceptación y contrapropuesta · story. Contract battery + ID-specific checks.
// coordinator decision 2026-09-26: the long-labels-stress field lengths are capped to the longest that fit 1:1 at 16 px
// (see the preset's description in the presets file); every value stays longer than baseline and every count is kept.
// acceptanceCheck (brief): continuity of the motion, anchored objects (every held prop sits on a SOLVED hand;
// the copy set glides on its rails; the reply rides the rail), and a transformation that stays recognisable
// with the labels hidden (checked on semantic state, which does not depend on text).
// Windows (LAW-0445.js W_SUB): latch 0.15–0.25 · lever 0.25–0.41 · different piece 0.23–0.37 (in the set at 0.37)
// · the set glides 0.41–0.55 · A reaches 0.54–0.60 and draws the reply back 0.60–0.71 · hold from 0.73.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0445';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const BASE = ['baseline-illustrative', 'contrast-or-alternative', 'baseline-es'];

contractSuite(ID, {
  continuity: ['handA', 'handB', 'handBn', 'setAt', 'spare'],
  attach: [
    // B's near hand holds the different piece until it is pushed into the set
    {from: 0, to: 0.369, a: 'handBn', b: 'spare', tol: 2.5},
    // the far hand is on the lever while pressing it
    {from: 0.371, to: 0.409, a: 'handB', b: 'leverGrip', tol: 1.5},
    // A's hand holds the reply's tab while drawing it back
    {from: 0.6, to: 1, a: 'handA', b: 'replyGrip', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.setOn === 'offer' && s.latchOpen === 0 && s.spareFaceUp === false && s.pull === 0", label: 'rest: the copy set lies on the offer; B holds a different piece face-down'},
    {at: 0.25, fn: "s.latchOpen === 1 && s.setOn === 'offer'", label: 'B opens the latch of the supplied piece before anything moves'},
    {at: 0.38, fn: "s.spareIn && s.spareFaceUp && s.setOn === 'offer' && s.latchOpen === 0", label: 'the different piece is clipped into the set (face-up) while the set is still on the offer'},
    {at: 0.48, fn: "s.setOn === 'moving' && s.pieceStays === 1", label: 'the set glides down; the released piece stays behind on the offer'},
    {at: 0.56, fn: "s.setOn === 'reply' && s.pull === 0", label: 'the set has arrived in the reply before A draws it back'},
    {at: 0.72, fn: "s.pull === 1 && s.dx < 0 && s.allReached", label: 'main action done by ~0.72: A has drawn the reply back'},
    {at: 1, fn: "s.layoutOk && s.allReached && s.beat === 'hold'", label: 'hold: layout fits, every hand on its target'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.setOn === 'reply' && s.spare === null && s.pieceStays === null && s.pull === 1", label: 'same-terms response: every piece arrives, no piece is replaced'},
    {at: 1, params: {finalState: 'on-board'}, fn: "s.setOn === 'reply' && s.pull === 0", label: 'finalState on-board: the reply stays on the board'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.setOn === 'offer'", label: 'actionProgress freezes the action part-way'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.setOn === 'reply' && s.pieceStays === 1 && s.spareIn", label: 'labels hidden: the same substitution happens'},
  ],
});

// Every preset × ratio × labels shown/hidden: layout fits, hands reach, people large (face diameter incl. hair in
// px at 1080p ≥ the accepted references: LAW-0197 104 / 108 / 77 baseline, 83 / 74 / 55 long labels).
ratioChecks(ID, 'layout fits, reach and person size', [
  {at: times(0, 1, 0.05), fn: 's.allReached', label: 'every hand reaches its target'},
  {at: [1], fn: 's.layoutOk', label: 'every label found a clear place'},
  {at: [1], ratios: ['16:9'], presets: BASE, fn: 's.headPx >= 104', label: 'face ≥ 104 px (16:9)'},
  {at: [1], ratios: ['9:16'], presets: BASE, fn: 's.headPx >= 108', label: 'face ≥ 108 px (9:16)'},
  {at: [1], ratios: ['1:1'], presets: BASE, fn: 's.headPx >= 77', label: 'face ≥ 77 px (1:1)'},
  {at: [1], ratios: ['16:9'], presets: ['long-labels-stress'], fn: 's.headPx >= 83', label: 'long labels: face ≥ 83 px (16:9)'},
  {at: [1], ratios: ['9:16'], presets: ['long-labels-stress'], fn: 's.headPx >= 74', label: 'long labels: face ≥ 74 px (9:16)'},
  {at: [1], ratios: ['1:1'], presets: ['long-labels-stress'], fn: 's.headPx >= 55', label: 'long labels: face ≥ 55 px (1:1)'},
]);

// Rendered: nothing (chip, legend, held piece, copy set) covers a face at any time.
const FACES_CLEAR = `(() => {
  const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  const R = e => e.getBoundingClientRect();
  const inter = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const shrink = b => ({left: b.left + b.width * 0.18, right: b.right - b.width * 0.18, top: b.top + b.height * 0.18, bottom: b.bottom - b.height * 0.18});
  const faces = ['st-A-head', 'st-B-head'].map(n => svg.querySelector('[data-node="' + n + '"]')).filter(Boolean).map(e => shrink(R(e)));
  if (faces.length !== 2) return false;
  const cards = [...svg.querySelectorAll('[data-node^="st-c"], [data-node="st-spare"], [data-node="st-set"], [data-node="st-reply"], [data-node="st-offer"], [data-node="legend"], [data-node="key"], [data-node="result"], [data-node^="note"], [data-node="marker"], [data-node^="st-chip"]')].filter(e => eff(e) > 0.05);
  return cards.every(c => faces.every(f => !inter(R(c), f)));
})()`;
ratioChecks(ID, 'no card, chip or prop over a face (rendered)', [
  {at: times(0, 1, 0.04), dom: FACES_CLEAR, label: 'rendered: no card, chip, piece or sheet covers a face'},
]);

// Rendered: no arm or hand is painted over visible text (limbs painted after the text).
const HANDS_CLEAR_OF_TEXT = `(() => {
  const vis = e => { for (let q = e; q && q !== svg; q = q.parentElement) { const o = q.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.05) return false; if (q.getAttribute('display') === 'none') return false; } return true; };
  const texts = [...svg.querySelectorAll('text tspan, text')].filter(t => (t.tagName === 'tspan' || !t.querySelector('tspan')) && (t.textContent || '').trim() && vis(t) && !t.closest('[data-layer="content-notice"]'))
    .map(t => ({el: t, r: t.getBoundingClientRect()})).filter(q => q.r.width > 1).map(q => ({el: q.el, l: q.r.left + 1, t: q.r.top + 1, r: q.r.right - 1, b: q.r.bottom - 1}));
  let limb = null;
  const inT = (x, y, pad) => texts.some(b => x > b.l - pad && x < b.r + pad && y > b.t - pad && y < b.b + pad && (b.el.compareDocumentPosition(limb) & Node.DOCUMENT_POSITION_FOLLOWING));
  for (const ln of svg.querySelectorAll('line[data-node]')) {
    const nm = ln.getAttribute('data-node');
    if (!/^st-[AB]-(near|far)-(u|l)$/.test(nm) || !vis(ln)) continue;
    limb = ln;
    const m = ln.getScreenCTM();
    const A = new DOMPoint(+ln.getAttribute('x1'), +ln.getAttribute('y1')).matrixTransform(m), B = new DOMPoint(+ln.getAttribute('x2'), +ln.getAttribute('y2')).matrixTransform(m);
    const half = parseFloat(ln.getAttribute('stroke-width')) * Math.abs(m.a) / 2;
    for (let i = 0; i <= 20; i++) { const x = A.x + (B.x - A.x) * i / 20, y = A.y + (B.y - A.y) * i / 20; if (inT(x, y, half)) return false; }
  }
  for (const hd of svg.querySelectorAll('[data-node$="-hand"]')) {
    if (!/^st-[AB]-(near|far)-hand$/.test(hd.getAttribute('data-node')) || !vis(hd)) continue;
    limb = hd;
    const r = hd.getBoundingClientRect();
    if (inT((r.left + r.right) / 2, (r.top + r.bottom) / 2, Math.min(r.width, r.height) * 0.35)) return false;
  }
  return true;
})()`;
ratioChecks(ID, 'hands and arms never cover text (rendered)', [
  {at: times(0, 1, 0.02), tv: ['all'], dom: HANDS_CLEAR_OF_TEXT, label: 'rendered: no arm or hand over any visible text'},
]);

// Rendered: the stage fills the caption-safe box (≥ 90 % on its long axis, ≥ 60 % on the other), labels on and off.
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74 - Math.min(vb.width, vb.height) * 0.057), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.55; })()";
ratioChecks(ID, 'the scene fills the caption-safe box (rendered)', [
  {at: [0, 1], dom: FILL, label: 'rendered: scene ≥ 90 % of the safe box on its long axis, ≥ 55 % on the other'},
]);

suppliedTextSuite(ID, {
  fields: `const r0 = p.responses[0];
    return [p.offer.reference, p.offer.title, ...p.parties.map(q => q.name), ...p.terms.map(t => t.label), ...p.terms.map(t => t.value),
      r0.reference, r0.mode === 'one-piece-substituted' ? r0.value : null, p.objectLabels.reply, ...p.annotations.map(a => a.text),
      p.actorLabels.a || p.parties[0].role, p.actorLabels.b || p.parties[1].role]`,
  content: `const r0 = p.responses[0];
    return [p.offer.reference, p.offer.title, ...p.parties.map(q => q.name), ...p.terms.map(t => t.label), ...p.terms.map(t => t.value), r0.reference, r0.mode === 'one-piece-substituted' ? r0.value : null]`,
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión', 'A different piece in the reply (as supplied)', 'Una pieza distinta en la respuesta (según lo aportado)']",
});

// Dense text-size audit (rendered): at every u step of 0.01, in every preset × ratio, EVERY visible <text> (badge
// letters, chips, card values mid-turn…) renders at or above the text floor (19.5 px in the default, baseline and baseline-es
// presets, 16 px otherwise), measured through the real CTM at 1080p.
test(`${ID}: every visible text stays at or above the text floor at every moment (u step 0.01, rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const ratios = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];
    const big = new Set(['default', 'baseline-illustrative', 'baseline-es']);
    const fails = [];
    let checked = 0;
    for (const pr of presets) {
      for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        const svg = x.element;
        const k = 1080 / Math.min(w, h);
        const floor = big.has(pr.name) ? 19.5 : 16;
        const texts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]'));
        for (let s = 0; s <= 100; s++) {
          x.seek((s / 100) * x.durationMs);
          const rootM = svg.getScreenCTM().inverse();
          for (const t of texts) {
            if (!t.textContent.trim()) continue;
            let op = 1, hidden = false;
            for (let n = t; n && n !== svg; n = n.parentNode) {
              const a = n.getAttribute('opacity');
              if (a !== null) op *= parseFloat(a);
              if (n.getAttribute('display') === 'none' || n.getAttribute('visibility') === 'hidden') hidden = true;
            }
            if (hidden || op < 0.02) continue;
            const m = rootM.multiply(t.getScreenCTM());
            const px = parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * k;
            checked++;
            if (px < floor - 0.05) fails.push(`${pr.name} ${ratio} u${(s / 100).toFixed(2)} "${t.textContent.trim().slice(0, 24)}" ${px.toFixed(1)}px < ${floor}`);
          }
        }
        x.destroy();
        el.remove();
      }
    }
    return {fails, checked};
  }, [ID, presets]);
  expect(out.checked).toBeGreaterThan(1000);
  expect(out.fails.slice(0, 12), `${out.fails.length} small-text samples`).toEqual([]);
});

// Rendered: no visible text is drawn over another visible text at any moment (u step 0.01, every preset × ratio).
// A text covered by a later-painted opaque card ([data-occludes]) counts as hidden.
test(`${ID}: no text is drawn over another text at any moment (u step 0.01, rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const ratios = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];
    const fails = [];
    let checked = 0;
    for (const pr of presets) {
      for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        const svg = x.element;
        const k = 1080 / Math.min(w, h);
        const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && !t.closest('[data-layer="content-notice"]'));
        const occluders = [...svg.querySelectorAll('[data-occludes]')];
        const visible = n0 => {
          let op = 1;
          for (let n = n0; n && n !== svg; n = n.parentNode) {
            const a = n.getAttribute('opacity');
            if (a !== null) op *= parseFloat(a);
            if (n.getAttribute('display') === 'none') return false;
          }
          return op >= 0.05;
        };
        for (let s = 0; s <= 100; s++) {
          x.seek((s / 100) * x.durationMs);
          const occ = occluders.filter(visible).map(o => ({o, b: o.getBoundingClientRect()}));
          const vis = [];
          for (const t of texts) {
            if (!visible(t)) continue;
            const b = t.getBoundingClientRect();
            if (!b.width || !b.height) continue;
            // hidden under a later-painted card that covers most of it
            const covered = occ.some(({o, b: c}) => !o.contains(t) && (t.compareDocumentPosition(o) & Node.DOCUMENT_POSITION_FOLLOWING)
              && Math.max(0, Math.min(b.right, c.right) - Math.max(b.left, c.left)) * Math.max(0, Math.min(b.bottom, c.bottom) - Math.max(b.top, c.top)) > 0.6 * b.width * b.height);
            if (!covered) vis.push({t, b});
          }
          for (let i = 0; i < vis.length; i++) {
            for (let j = i + 1; j < vis.length; j++) {
              const a = vis[i].b, c = vis[j].b;
              const ox = Math.min(a.right, c.right) - Math.max(a.left, c.left), oy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
              checked++;
              // line boxes carry leading: an overlap counts from 3 px across and a quarter of the lower line height
              if (!(ox * k > 3 && oy > 0.25 * Math.min(a.height, c.height))) continue;
              // the later-painted text sits on its own opaque card that covers the shared area: the earlier text is
              // hidden there
              const [lo, hi] = vis[i].t.compareDocumentPosition(vis[j].t) & Node.DOCUMENT_POSITION_FOLLOWING ? [vis[i].t, vis[j].t] : [vis[j].t, vis[i].t];
              const ix = {l: Math.max(a.left, c.left), r: Math.min(a.right, c.right), t: Math.max(a.top, c.top), b: Math.min(a.bottom, c.bottom)};
              if (occ.some(({o, b: q}) => o.contains(hi) && !o.contains(lo) && (lo.compareDocumentPosition(o) & Node.DOCUMENT_POSITION_FOLLOWING)
                && q.left <= ix.l + 1 && q.right >= ix.r - 1 && q.top <= ix.t + 1 && q.bottom >= ix.b - 1)) continue;
              fails.push(`${pr.name} ${ratio} u${(s / 100).toFixed(2)} "${vis[i].t.textContent.trim().slice(0, 18)}" × "${vis[j].t.textContent.trim().slice(0, 18)}" ${(ox * k).toFixed(0)}×${(oy * k).toFixed(0)}px`);
            }
          }
        }
        x.destroy();
        el.remove();
      }
    }
    return {fails, checked};
  }, [ID, presets]);
  expect(out.checked).toBeGreaterThan(1000);
  const seen = new Set();
  const uniq = out.fails.filter(f => { const key = f.replace(/ u[0-9.]+ /, ' '); if (seen.has(key)) return false; seen.add(key); return true; });
  expect(uniq.slice(0, 25), `${out.fails.length} overlapping text samples`).toEqual([]);
});

// Rendered, 60 fps: until it is seated, the different piece B brings in never covers any visible text (field labels,
// other pieces, headers, chips) nor a face; it hangs at B's side below its row, turns edge-on, rises at the column's
// edge and unfolds into its own slot. Every preset × ratio × labels state.
test(`${ID}: the incoming piece never covers text or a face before it is seated (60 fps, rendered)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let frames = 0;
    for (const pr of presets) {
      for (const tv of ['all', 'none']) {
        for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
          await x.ready;
          const svg = x.element;
          const spare = svg.querySelector('[data-node="st-spare"]');
          if (!spare) { x.destroy(); el.remove(); continue; }
          const op = n0 => { let o = 1; for (let n = n0; n && n !== svg; n = n.parentNode) { const a = n.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (n.getAttribute('display') === 'none') return 0; } return o; };
          const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && !spare.contains(t));
          const heads = ['st-A-head', 'st-B-head'].map(n => svg.querySelector(`[data-node="${n}"]`)).filter(Boolean);
          const sr = svg.getBoundingClientRect();
          const px = w / sr.width;
          for (let u = 0; u <= 0.4; u += 1 / 360) {
            x.seek(u * x.durationMs);
            const s = x.getState({bounds: false}).semantic;
            if (s.spareIn || op(spare) < 0.05) continue;
            frames++;
            const c = spare.getBoundingClientRect();
            for (const hd of heads) {
              const b = hd.getBoundingClientRect();
              const f = {l: b.left + b.width * 0.18, r: b.right - b.width * 0.18, t: b.top + b.height * 0.18, b: b.bottom - b.height * 0.18};
              if (c.left < f.r && c.right > f.l && c.top < f.b && c.bottom > f.t) fails.push(`${pr.name} ${tv} ${ratio} u${u.toFixed(4)} over a face`);
            }
            for (const t of texts) {
              if (op(t) < 0.05) continue;
              const b = t.getBoundingClientRect();
              const ox = Math.min(b.right, c.right) - Math.max(b.left, c.left), oy = Math.min(b.bottom, c.bottom) - Math.max(b.top, c.top);
              // (the copy in the slot the piece is seated onto: wholly under the piece, painted before it — hidden,
              // not crossed; a partly covered text is hidden by the scene itself)
              if (ox >= b.width - 1 && oy >= b.height - 1 && (t.compareDocumentPosition(spare) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
              // (a text's box carries its leading: an overlap counts from a fifth of its height)
              if (ox * px > 1 && oy > 0.2 * b.height) fails.push(`${pr.name} ${tv} ${ratio} u${u.toFixed(4)} over "${t.textContent.trim().slice(0, 16)}"`);
            }
          }
          x.destroy();
          el.remove();
        }
      }
    }
    return {fails, frames};
  }, [ID, presets]);
  expect(out.frames).toBeGreaterThan(500);
  const seen = new Set();
  const uniq = out.fails.filter(f => { const key = f.replace(/ u[0-9.]+ /, ' '); if (seen.has(key)) return false; seen.add(key); return true; });
  expect(uniq.slice(0, 25), `${out.fails.length} samples`).toEqual([]);
});

// Rendered determinism (seek history): after forward playback at 60 fps (and after backward seeks), the whole SVG at
// u 0.45, 0.6, 0.8 and 1 is identical to a fresh instance seeked straight there. Every attribute is a pure function of
// (params, u). Every preset × ratio.
test(`${ID}: the render does not depend on seek history (60 fps playback and backward seeks vs fresh seek)`, async ({page}) => {
  test.setTimeout(900000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let compared = 0;
    const snap = svg => [...svg.querySelectorAll("*")].map(e => `${e.tagName}|${[...e.attributes].map(a => `${a.name}=${a.value}`).join(" ")}`.replace(/law-anim-[0-9]+-/g, "law-anim-#-"));
    const make = async (w, h, params) => { const el = document.createElement('div'); document.getElementById('slots').appendChild(el); const x = def.create(el, {width: w, height: h, params}); await x.ready; return {x, el}; };
    for (const pr of presets) {
      for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const played = await make(w, h, pr.params);
        const fresh = await make(w, h, pr.params);
        const D = played.x.durationMs;
        const marks = [0.45, 0.6, 0.8, 1];
        const cmp = (label, u) => {
          fresh.x.seek(u * D);
          const a = snap(played.x.element), b = snap(fresh.x.element);
          compared++;
          if (a.length !== b.length) { fails.push(`${pr.name} ${ratio} ${label} u${u}: node count ${a.length} vs ${b.length}`); return; }
          const diff = a.map((v, i) => (v === b[i] ? null : i)).filter(i => i !== null);
          if (diff.length) fails.push(`${pr.name} ${ratio} ${label} u${u}: ${diff.length} nodes differ, e.g. ${a[diff[0]].slice(0, 140)} ≠ ${b[diff[0]].slice(0, 140)}`);
        };
        // forward playback at 60 fps, compared at each mark as it is reached
        let mi = 0;
        for (let t = 0; t <= D + 1e-6; t += 1000 / 60) {
          played.x.seek(t);
          while (mi < marks.length && t / D >= marks[mi] - 1e-9 && t / D < marks[mi] + 1000 / 60 / D) { played.x.seek(marks[mi] * D); cmp('forward', marks[mi]); mi++; }
        }
        played.x.seek(D);
        cmp('end', 1);
        // backward seeks from the end
        for (const u of [0.8, 0.6, 0.45, 0.1, 0.6, 1, 0.45]) { played.x.seek(u * D); cmp('backward', u); }
        for (const o of [played, fresh]) { o.x.destroy(); o.el.remove(); }
      }
    }
    return {fails, compared};
  }, [ID, presets]);
  expect(out.compared).toBeGreaterThan(100);
  expect(out.fails.slice(0, 20), `${out.fails.length} seek-history differences`).toEqual([]);
});
