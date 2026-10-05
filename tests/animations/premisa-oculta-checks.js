// Rendered-DOM checks shared by the "Premisa oculta" tests (LAW-0109..0112), added after reviewer round 1.
// Not a test file itself (no .test.js suffix). For every preset × real 16:9 / 9:16 / 1:1 frame at the given times:
//  - every visible text inside a chip ([data-chip] group) lies inside the chip's own box;
//  - no visible multi-line text breaks a word across lines (AUTHORING item 13): a line boundary whose two halves
//    join into a word of the supplied/built-in texts while the first half alone is not one;
//  - optional: named marks (pins, guides) do not touch any visible text.
import {test, expect} from '@playwright/test';
import {presetsFor} from '../harness/contract.js';
import {PO_STRINGS} from '../../src/animations/reasoning/kits/premisa-oculta.js';

const RATIOS = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];

/**
 * @param {string} id
 * @param {{at?: number[], clearOfText?: string[], label?: string}} o  clearOfText: data-node names (prefix match) of marks
 *   whose visible painted parts (paths/lines/circles) must not overlap any visible text box.
 */
export function motifDomChecks(id, o = {}) {
  const builtIn = Object.values(PO_STRINGS).flatMap(t => Object.values(t));
  test(`${id}: text stays inside its chip, no word split across lines${o.clearOfText ? ', marks clear of text' : ''} (presets × ratios)`, async ({page}) => {
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(id)];
    const out = await page.evaluate(async ([id, presets, ratios, at, clear, builtIn]) => {
      const def = await window.__lib.load(id);
      const shown = el => {
        for (let n = el; n && n.tagName !== 'svg'; n = n.parentNode) {
          const op = n.getAttribute && n.getAttribute('opacity');
          if (op !== null && op !== undefined && parseFloat(op) < 0.5) return false;
          if (n.getAttribute && n.getAttribute('display') === 'none') return false;
        }
        const b = el.getBBox();
        return b.width > 0 && b.height > 0;
      };
      const boxOf = (svg, el) => {
        const bb = el.getBBox();
        const m = svg.getScreenCTM().inverse().multiply(el.getScreenCTM());
        const pts = [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
        const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
        return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
      };
      const inter = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
      const wordsOf = v => {
        const out = [];
        const walk = x => { if (typeof x === 'string') out.push(...x.toLowerCase().split(/\s+/)); else if (x && typeof x === 'object') Object.values(x).forEach(walk); };
        walk(v);
        return out.map(w => w.replace(/[^\p{L}\p{N}’']/gu, '')).filter(Boolean);
      };
      const rows = [];
      for (const pr of presets) {
        for (const [ratio, w, h] of ratios) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: pr.params});
          await x.ready;
          const params = x.getState({bounds: false}).params;
          const dict = new Set([...wordsOf(params), ...wordsOf(builtIn)]);
          for (const u of at) {
            x.seek(u * x.durationMs);
            const svg = x.element;
            const texts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]')).filter(shown);
            // 1) chips
            const outside = [];
            for (const c of svg.querySelectorAll('[data-chip]')) {
              if (!shown(c)) continue;
              const shapes = [...c.children].filter(k => k.tagName === 'path' || k.tagName === 'rect');
              if (!shapes.length) continue;
              const boxes = shapes.map(k => boxOf(svg, k));
              const box = boxes.reduce((a, b) => (b.w * b.h > a.w * a.h ? b : a));
              for (const t of c.querySelectorAll('text')) {
                if (!shown(t)) continue;
                const tb = boxOf(svg, t);
                if (tb.x < box.x - 2 || tb.y < box.y - 3 || tb.x + tb.w > box.x + box.w + 2 || tb.y + tb.h > box.y + box.h + 3) outside.push(t.textContent.slice(0, 30));
              }
            }
            // 2) split words
            const splits = [];
            for (const t of texts) {
              const lines = [...t.querySelectorAll('tspan')].map(s => s.textContent.trim()).filter(Boolean);
              for (let i = 1; i < lines.length; i++) {
                const a = lines[i - 1].split(/\s+/).pop().toLowerCase().replace(/[^\p{L}\p{N}’']/gu, '');
                const b = lines[i].split(/\s+/)[0].toLowerCase().replace(/[^\p{L}\p{N}’']/gu, '');
                if (a && b && dict.has(a + b) && !dict.has(a)) splits.push(`${a}|${b}`);
              }
            }
            // 3) marks clear of text
            const onText = [];
            for (const name of clear || []) {
              for (const g of svg.querySelectorAll(`[data-node^="${name}"]`)) {
                if (!shown(g)) continue;
                const parts = g.matches('path,line,circle,rect') ? [g] : [...g.querySelectorAll('path,line,circle,rect')];
                for (const pEl of parts) {
                  if (!shown(pEl)) continue;
                  if (pEl.tagName === 'path' || pEl.tagName === 'line') {
                    // sample the stroke (the actually drawn part: dash offset respected via getTotalLength of visible dash)
                    const len = pEl.getTotalLength ? pEl.getTotalLength() : 0;
                    const dash = parseFloat(pEl.getAttribute('stroke-dasharray') || '0') || len;
                    const off = parseFloat(pEl.getAttribute('stroke-dashoffset') || '0');
                    const drawn = Math.max(0, Math.min(len, dash - off));
                    for (let d = 0; d <= drawn; d += 6) {
                      const q = pEl.getPointAtLength(d);
                      const m = svg.getScreenCTM().inverse().multiply(pEl.getScreenCTM());
                      const px = {x: m.a * q.x + m.c * q.y + m.e, y: m.b * q.x + m.d * q.y + m.f, w: 0.1, h: 0.1};
                      const hit = texts.find(t => !g.contains(t) && inter(px, boxOf(svg, t), 1));
                      if (hit) { onText.push(`${g.getAttribute('data-node')}→${hit.textContent.slice(0, 20)}`); break; }
                    }
                  } else {
                    const pb = boxOf(svg, pEl);
                    const hit = texts.find(t => !g.contains(t) && inter(pb, boxOf(svg, t), 0));
                    if (hit) onText.push(`${g.getAttribute('data-node')}→${hit.textContent.slice(0, 20)}`);
                  }
                }
              }
            }
            rows.push({preset: pr.name, ratio, u, outside, splits, onText: [...new Set(onText)]});
          }
          x.destroy();
          el.remove();
        }
      }
      return rows;
    }, [id, presets, RATIOS, o.at || [0.35, 0.7, 1], o.clearOfText || null, builtIn]);
    for (const r of out) {
      const tag = `${r.preset} ${r.ratio} @${r.u}`;
      expect.soft(r.outside, `${tag}: text outside its chip`).toEqual([]);
      expect.soft(r.splits, `${tag}: word split across lines`).toEqual([]);
      expect.soft(r.onText, `${tag}: marks touching text`).toEqual([]);
    }
  });
}
