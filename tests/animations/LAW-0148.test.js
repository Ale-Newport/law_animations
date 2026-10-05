// LAW-0148 — Delegación normativa · inspect. Contract battery + ID-specific checks encoding the
// brief's acceptanceCheck: the detail keeps its source coordinates (a real enlarged copy of the same
// stage region, tied to the context thumbnail), the change is localized (only the tag value and the
// geometry that depends on the supplied after-state), and seeking back restores the old datum.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {wordBreakSuite} from './delegacion-normativa-words.js';
import {ratioChecks} from '../harness/ratio-checks.js';

const SHAPES = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.366, bottom: 0.2, left: 0.366}}};
const variants = [['default', {}], ...presetsFor('LAW-0148').map(pr => [pr.name, pr.params]), ['labels-hidden', {textVisibility: 'none'}]];
const each = (times, fn, label) => variants.flatMap(([name, params]) => Object.entries(SHAPES).flatMap(([shape, sa]) => times.map(at => ({
  at, params: {...params, ...sa}, fn, label: `${label} (${name}, ${shape}, t=${at})`,
}))));

contractSuite('LAW-0148', {
  continuity: ['sourceOnStage', 'detail'],
  // the detail window is a real enlarged copy (text copies marked with a zero-width space)
  allowTextOverlap: ['​'],
  semantic: [
    {at: 0.19, fn: "s.lensOpen === 0 && s.contextScale === 1 && s.datum === 'Authorization supplied' && s.clipFastened && s.hlArt === 1 && s.tagFlip === 1", label: 'build: the state produced by the action (clip fastened, passage marked, tag written) before any zoom'},
    {at: 0.3, fn: 's.lensMapsSource && s.lensOpen > 0 && s.contextScale < 1', label: 'isolate: the detail is a copy anchored on the source frame of the shrinking context'},
    {at: 0.44, fn: "s.lensOpen === 1 && s.magnification > 1.5 && s.lensMapsSource && s.datum === 'Authorization supplied' && s.swap === 0 && s.clipFastened", label: 'the detail is enlarged before anything is substituted'},
    {at: 0.7, fn: "s.datum === 'Authorization to be checked' && s.swap === 1 && s.lensOpen === 1 && s.clipOffPage && !s.clipFastened && s.pencilArt === 1 && s.traceShown", label: 'substitute: the tag value and only its dependent geometry change (clip laid beside the page); the before trace is kept'},
    {at: 0.4, fn: "s.datum === 'Authorization supplied' && s.swap === 0 && s.clipFastened", label: 'seeking back restores the old datum and geometry exactly'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextScale === 1 && s.markerShown && s.keyShown && s.datum === 'Authorization to be checked' && s.clipOffPage", label: 'return: full context, changed-datum marker, supplied after-state'},
    {at: 1, params: {states: {before: 'authorization-supplied', after: 'authorization-supplied'}}, fn: "s.clipFastened && s.datum === 'Authorization to be checked'", label: 'the geometry follows the SUPPLIED state, never the tag wording (equal states: the clip stays fastened)'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.clipOffPage && s.lensOpen === 0 && s.markerShown', label: 'the substitution plays with labels hidden'},
    ...each([0.3], 's.thumbSame', 'the context thumbnail is the same desk (same geometry, wording as bars)'),
    ...each([1], 's.markNoteTouches', 'a changed-datum note without a leader touches its marker'),
    // review: the Δ marker is pinned on the changed tag; its note is set at the captions' size
    ...each([1], 's.markOnTag && s.markNoteFull', 'the changed-datum marker sits on the changed tag; its note at full caption size'),
    // review: while inspecting, the context stays large beside the window (never a small corner thumbnail)
    ...each([0.5, 0.7], 's.ctxScale >= 0.44 && s.contextScale === s.ctxScale', 'the context stays large (>= 0.44 of the stage) beside the detail window'),
    ...each([1], 's.holdClear && s.tagClear', 'key, caption and changed-datum note clear of the objects; the tag hangs clear of texts and clip'),
  ],
});

suppliedTextSuite('LAW-0148', {
  fields: 'return [...p.sources.flatMap(s => [s.id, s.title, s.provision]), ...p.hierarchy.levels, p.hierarchy.caption, ...p.interpretations.flatMap(i => [i.by, i.text]), p.afterValue, p.contextLabels.context, p.contextLabels.marker, p.beforeValue];',
  content: 'return [...p.sources.flatMap(s => [s.title, s.provision]), ...p.hierarchy.levels, ...p.interpretations.flatMap(i => [i.text]), p.afterValue];',
  // generic captions: kit key / headers / state labels, legend entries, annotations and supplied captions
  minAny: 16,
  captions: 'const es = p.locale === "es"; const K = [es ? "Según lo aportado · sin conclusión" : "As supplied · no conclusion drawn", es ? "Lectura propuesta" : "Reading proposed", es ? "Jerarquía editable" : "Editable hierarchy", es ? "Habilitación aportada" : "Authorization supplied", es ? "Habilitación por comprobar" : "Authorization to be checked"]; return [...K.slice(0, 3), p.contextLabels.context, p.contextLabels.marker, p.hierarchy.caption];',
});

wordBreakSuite('LAW-0148');

// Review (rendered): at the hold the changed-datum note sits right next to its marker — its leader (if it
// has one) is short (<= 125 px at 1080p) and crosses no other line or element: not the cord, not the book,
// the sheet, the tag, the clip, the board, the reading card, the key, the caption, nor any other text.
test.describe('LAW-0148 marker note leader (rendered)', () => {
  test('LAW-0148: the marker note leader is short and crosses nothing (every preset × ratio, at the hold)', async ({page}) => {
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0148'), {name: 'labels-hidden', params: {textVisibility: 'none'}}];
    const bad = await page.evaluate(async ([presets]) => {
      const def = await window.__lib.load('LAW-0148');
      const out = [];
      for (const pr of presets) {
        for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: pr.params});
          await x.ready;
          x.seek(x.durationMs);
          const svg = x.element, inv = svg.getScreenCTM().inverse(), k = 1080 / Math.min(w, h);
          const toRoot = (px, py) => { const q = new DOMPoint(px, py).matrixTransform(inv); return {x: q.x, y: q.y}; };
          const nodeEl = n => svg.querySelector(`[data-node="${n}"]`);
          const shown = e => { for (let q = e; q && q !== svg; q = q.parentNode) { const o = q.getAttribute && q.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.05) return false; } return true; };
          const lead = nodeEl('mark-note-lead');
          const tag = `${pr.name} ${ratio}`;
          if (!lead || !shown(lead)) { el.remove(); continue; }
          const m = lead.getScreenCTM();
          const sp = (ax, ay) => { const q = new DOMPoint(ax, ay).matrixTransform(m); return toRoot(q.x, q.y); };
          const A = sp(+lead.getAttribute('x1'), +lead.getAttribute('y1')), B = sp(+lead.getAttribute('x2'), +lead.getAttribute('y2'));
          const len = Math.hypot(B.x - A.x, B.y - A.y) * k;
          if (len > 125) out.push(`${tag}: leader ${Math.round(len)} px long`);
          const box = e => { const b = e.getBoundingClientRect(); const p0 = toRoot(b.left, b.top), p1 = toRoot(b.right, b.bottom); return {x: p0.x, y: p0.y, w: p1.x - p0.x, h: p1.y - p0.y}; };
          const mk = box(nodeEl('mark')), mc = {x: mk.x + mk.w / 2, y: mk.y + mk.h / 2}, mr = Math.max(mk.w, mk.h) / 2 + 3;
          const pts = Array.from({length: 60}, (_, i) => ({x: A.x + (B.x - A.x) * (i + 0.5) / 60, y: A.y + (B.y - A.y) * (i + 0.5) / 60}))
            .filter(q => Math.hypot(q.x - mc.x, q.y - mc.y) > mr);
          // elements the leader must not pass through
          const own = nodeEl('mark-note');
          const els = [...svg.querySelectorAll('[data-node]')].filter(e => /^(ctx-(bookg|instg|tag|clip|board|note|lupa)|key-note|ctx-caption)$/.test(e.getAttribute('data-node')) && shown(e));
          const texts = [...svg.querySelectorAll('text')].filter(t => shown(t) && !own.contains(t) && !t.closest('[data-layer="content-notice"]'));
          for (const e of [...els, ...texts]) {
            const b = box(e);
            if (b.w < 1 || b.h < 1) continue;
            if (pts.some(q => q.x > b.x + 2 && q.x < b.x + b.w - 2 && q.y > b.y + 2 && q.y < b.y + b.h - 2)) out.push(`${tag}: leader passes through ${e.getAttribute('data-node') || 'text "' + e.textContent.slice(0, 24) + '"'}`);
          }
          // the cord (the lines of the link): no crossing
          const cross = (p1, p2, p3, p4) => { const o = (a, b, c) => Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)); return o(p1, p2, p3) * o(p1, p2, p4) < 0 && o(p3, p4, p1) * o(p3, p4, p2) < 0; };
          for (const path of nodeEl('ctx-cord') ? nodeEl('ctx-cord').querySelectorAll('path') : []) {
            const L = path.getTotalLength(), pm = path.getScreenCTM();
            const cp = Array.from({length: 80}, (_, i) => { const q = path.getPointAtLength(L * i / 79).matrixTransform(pm); return toRoot(q.x, q.y); });
            if (cp.slice(1).some((q, i) => cross(A, B, cp[i], q))) { out.push(`${tag}: leader crosses the cord`); break; }
          }
          x.destroy?.();
          el.remove();
        }
      }
      return [...new Set(out)];
    }, [presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

// Review (rendered, dense): no two VISIBLE copies of the same text overlap while the detail window opens,
// is held and closes (the LAW-0164 pattern: the card fades blank; its copy shows only once it is opaque, and
// then hides the context beneath it). Effective opacity is the product up the tree; boxes are cut to the
// window's clip; the copy's zero-width marks are ignored so copy and source compare equal.
const NO_DOUBLE = `(() => {
  const eff = el => { let o = 1; for (let e = el; e && e !== svg.parentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= parseFloat(cs.opacity); } return o; };
  const clipOf = el => { let b = null; for (let e = el; e && e !== svg; e = e.parentElement) { const c = e.getAttribute && e.getAttribute('clip-path'); if (!c) continue; const m = c.match(/#([^)'"]+)/); const cp = m && svg.querySelector('#' + CSS.escape(m[1])); const sh = cp && cp.querySelector('rect'); if (!sh) continue; const r = clipRect(e, sh); b = b ? cut(b, r) : r; } return b; };
  const clipRect = (user, rc) => { const m = user.getScreenCTM(); const a = ['x', 'y', 'width', 'height'].map(k => parseFloat(rc.getAttribute(k)) || 0); const pts = [[a[0], a[1]], [a[0] + a[2], a[1] + a[3]]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m)); return {left: Math.min(pts[0].x, pts[1].x), top: Math.min(pts[0].y, pts[1].y), right: Math.max(pts[0].x, pts[1].x), bottom: Math.max(pts[0].y, pts[1].y)}; };
  const cut = (a, b) => ({left: Math.max(a.left, b.left), top: Math.max(a.top, b.top), right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom)});
  const items = [];
  for (const t of svg.querySelectorAll('text')) {
    const txt = (t.textContent || '').replace(/\\u200B/g, '').replace(/\\s+/g, ' ').trim();
    if (!txt || eff(t) <= 0.05) continue;
    const r0 = t.getBoundingClientRect(); let r = {left: r0.left, top: r0.top, right: r0.right, bottom: r0.bottom};
    const c = clipOf(t); if (c) r = cut(r, c);
    if (r.right - r.left < 2 || r.bottom - r.top < 2) continue;
    items.push({txt, r, el: t});
  }
  const bg = svg.querySelector('[data-node="det-bg"]');
  const occ = bg && eff(bg) >= 0.99 ? bg.getBoundingClientRect() : null;
  const inWin = t => Boolean(t.closest('[data-node="det"]'));
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j];
    if (a.txt !== b.txt) continue;
    const x = cut(a.r, b.r);
    if (!(x.right - x.left > 2 && x.bottom - x.top > 2)) continue;
    const hidden = occ && inWin(a.el) !== inWin(b.el) && x.left >= occ.left && x.right <= occ.right && x.top >= occ.top && x.bottom <= occ.bottom;
    if (!hidden) return false;
  }
  return true;
})()`;
const dense = (a, b, step) => Array.from({length: Math.round((b - a) / step) + 1}, (_, i) => Math.round((a + i * step) * 1000) / 1000);

ratioChecks('LAW-0148', 'real magnification; never a double image while the window opens, holds and closes', [
  // review: the window shows the isolated link point at >= 1.5x its size in the hold scene
  {at: [0.45, 0.5, 0.6, 0.7], fn: 's.magnification >= 1.5 && s.lensOpen === 1', label: 'window scale / hold scale >= 1.5 while the window is open'},
  {at: dense(0.2, 0.85, 0.01), dom: NO_DOUBLE, label: 'no two visible copies of the same text overlap (u 0.20–0.85)', tv: ['all']},
]);
