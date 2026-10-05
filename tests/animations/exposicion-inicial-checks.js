// Rendered-DOM checks for the four "Exposición inicial" entries (LAW-0285..0288, hearings-02). The shared pilot checks
// (./apertura-audiencia-checks.js) are imported read-only; this file adds the motif's own: arms (the item in hand is
// exempt), lines never under a text, every text line inside its own chip/card, extra neutrality words, es words.
// All sizes are measured on the RENDERED DOM at 1080p; each test prints its extreme values prefixed "[hearings-02]".
import {test, expect} from '@playwright/test';
import {forAll} from './apertura-audiencia-checks.js';

export const report2 = (ID, name, stats) => console.log(`[hearings-02] ${ID} ${name}: ${JSON.stringify(stats)}`);

/** English words that must not leak into a locale-'es' render (default texts). */
export const ES_WORDS = ['Participant', 'Exhibit', 'Room', 'fictional', 'supplied', 'Sequence', 'Wall', 'lectern', 'Lectern', 'table', 'Claim', 'Support', 'Question', 'configured', 'conclusion', 'Line', 'was', 'Changed', 'Order', 'shown'];

/**
 * Arms (the whole sleeve, sampled as discs) never lie over a visible text, a chip body, another person's head or a
 * listed prop. The item the presenter is handling (semantic `active`) — its slip and card — is exempt, and so is the
 * stack of slips on the lectern (the hand takes the top one).
 */
export function armsClearTest(ID, {people = '^(?:rm|ra|rb)-p(\\d)$', props = [], step = 0.01, prefixes = ['rm']} = {}) {
  test(`${ID}: no arm covers a text, a chip, another head or a prop at any u (step ${step}), labels shown and hidden`, async ({page}) => {
    test.setTimeout(900000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      const RE = new RegExp(arg.people);
      for (let u = 0; u <= 1.0001; u += arg.step) {
        x.seek(u * x.durationMs);
        const s = x.getState({bounds: false}).semantic;
        const act = s.active;
        const ppl = nodes(svg, RE).filter(e => eff(svg, e) > 0.3);
        const T = texts(svg, 0.3).map(t => ({t, b: box(t)}));
        const chips = [...svg.querySelectorAll('[data-node$="-body"]')].filter(e => eff(svg, e) > 0.3 && !/-card\\d+-body$/.test(e.getAttribute('data-node'))).map(box);
        for (const p of ppl) {
          const nm = p.getAttribute('data-node');
          const pre = nm.split('-')[0];
          const heads = ppl.filter(q => q !== p).map(q => node(svg, q.getAttribute('data-node') + '-head')).filter(Boolean).map(box);
          const mine = n => act !== null && act !== undefined && (n.startsWith(pre + '-card' + act) || n.startsWith(pre + '-slipwrap' + act));
          const propEls = arg.props.flatMap(sel => [...svg.querySelectorAll(sel)]).filter(e => eff(svg, e) > 0.3 && !mine(e.getAttribute('data-node') || ''));
          for (const arm of ['armL', 'armR']) {
            const a = node(svg, nm + '-' + arm + '-o');
            if (!a) continue;
            const ds = armDiscs(a);
            const tag = pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': ' + nm + ' ' + arm;
            const ownT = q => { const c = q.t.closest('[data-node^="' + pre + '-card"]'); return Boolean(c) && mine(c.getAttribute('data-node')); };
            if (ds.some(d => T.some(q => !ownT(q) && discHits(d, q.b)))) out.push(tag + ' over a text');
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
 * Lines (connectors, tethers, guides: stroked unfilled paths listed by selector) never run under a visible text that
 * is not their own caption (sampled along the stroke at every listed u).
 */
export function linesOffTextTest(ID, {lines = [], at = null, step = 0.02} = {}) {
  test(`${ID}: no line (tether, connector, guide) runs under a visible text at any u (step ${step})`, async ({page}) => {
    test.setTimeout(900000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      const us = arg.at || Array.from({length: Math.round(1 / arg.step) + 1}, (_, i) => i * arg.step);
      let checked = 0;
      for (const u of us) {
        x.seek(u * x.durationMs);
        const T = texts(svg, 0.3).map(t => ({t, b: box(t)}));
        for (const sel of arg.lines) for (const ln of svg.querySelectorAll(sel)) {
          if (eff(svg, ln) < 0.3 || !ln.getTotalLength) continue;
          const m = ln.getScreenCTM(); const L = ln.getTotalLength();
          const off = parseFloat(ln.getAttribute('stroke-dashoffset') || '0') || 0;
          const shown = ln.hasAttribute('data-draw') ? Math.max(0, L - off) : L;
          const sw = (parseFloat(ln.getAttribute('stroke-width')) || 2) * Math.hypot(m.a, m.b) / 2;
          for (let t = 0; t <= shown; t += 3) {
            const p0 = ln.getPointAtLength(t); const p = new DOMPoint(p0.x, p0.y).matrixTransform(m);
            checked++;
            const own = ln.parentNode && ln.parentNode.closest ? ln.parentNode.closest('g[data-node]') : null;
            for (const q of T) if (!(own && own.contains(q.t)) && p.x > q.b.l - sw && p.x < q.b.r + sw && p.y > q.b.t - sw && p.y < q.b.b + sw) { out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': ' + (ln.getAttribute('data-node') || sel) + ' under "' + q.t.textContent.slice(0, 24) + '"'); break; }
          }
        }
      }
      stat('line samples ' + ratio, checked, 'max');
      return [...new Set(out)];`, {lines, at, step}, {withHidden: true});
    report2(ID, 'lines off text', stats);
    expect(bad.slice(0, 20), bad.slice(0, 20).join('\n')).toEqual([]);
  });
}

/**
 * Every visible text line (each tspan) lies inside the frame and, when the text belongs to a chip or card (a group with
 * a "-body" child), inside that body — nothing is cut, hidden past an edge or spills out of its box.
 */
export function textLinesVisibleTest(ID, {step = 0.05} = {}) {
  test(`${ID}: every visible text line lies inside the frame and inside its own chip or card (step ${step})`, async ({page}) => {
    test.setTimeout(900000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      const F = svg.getBoundingClientRect();
      let lines = 0;
      for (let u = 0; u <= 1.0001; u += arg.step) {
        x.seek(u * x.durationMs);
        for (const t of texts(svg, 0.3)) {
          let host = null;
          // (a substituted datum and its dock travel out of their card by design)
          if (t.closest('[data-node$="-datum"]')) continue;
          for (let q = t.parentNode; q && q !== svg; q = q.parentNode) {
            if (!q.getAttribute) continue;
            const nm = q.getAttribute('data-node');
            if (nm && q.querySelector(':scope > [data-node="' + nm + '-body"]')) { host = q.querySelector(':scope > [data-node="' + nm + '-body"]'); break; }
          }
          const hb = host ? box(host) : null;
          for (const sp of (t.querySelectorAll('tspan').length ? t.querySelectorAll('tspan') : [t])) {
            const b = box(sp);
            if (b.w < 0.5) continue;
            lines++;
            if (b.l < F.left - 0.5 || b.t < F.top - 0.5 || b.r > F.right + 0.5 || b.b > F.bottom + 0.5) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': line "' + sp.textContent.slice(0, 24) + '" outside the frame');
            if (hb && (b.l < hb.l - 1 || b.r > hb.r + 1 || b.t < hb.t - 2 || b.b > hb.b + 2)) out.push(pr.name + ' ' + ratio + ' u=' + u.toFixed(2) + ': line "' + sp.textContent.slice(0, 24) + '" spills out of its box');
          }
        }
      }
      stat('text lines checked ' + ratio, lines, 'max');
      return [...new Set(out)];`, {step}, {withHidden: true});
    report2(ID, 'text lines', stats);
    expect(bad.slice(0, 20), bad.slice(0, 20).join('\n')).toEqual([]);
  });
}

/** Extra legal neutrality for this motif: nothing assesses a claim or its support (proof, weight, burden, sufficiency, outcome). */
export function assessmentFreeTest(ID) {
  test(`${ID}: no text assesses a claim or its support (proof, weight, burden, sufficiency, credibility, winner)`, async ({page}) => {
    test.setTimeout(400000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      const re = /(proven|unproven|probad[oa]s?\\b|acreditad|demostrad|burden|carga de la prueba|weight|peso\\b|sufficien|suficien|insufficien|credib|cre[ií]ble|convinc|persuas|stronger|weaker|m[aá]s fuerte|m[aá]s d[eé]bil|true\\b|false\\b|verdader|fals[oa]|admitted|admitid|rejected|rechazad|upheld|estimad)/i;
      for (const u of [0, 0.3, 0.6, 0.8, 1]) {
        x.seek(u * x.durationMs);
        for (const t of texts(svg, 0.05)) if (re.test(t.textContent)) out.push(pr.name + ' ' + ratio + ': "' + t.textContent.slice(0, 50) + '"');
      }
      return [...new Set(out)];`, {}, {withHidden: false});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/**
 * Subject height measured against the RENDERED FRAME (the viewBox as letterboxed inside the square test slot), not the
 * slot: the shared fillMost subject figure divides by the 480 px slot, which understates a 16:9 frame (270 px tall).
 */
export function subjectFrameTest(ID, {subject, at = [0.05, 0.5, 1], min = 0.2} = {}) {
  test(`${ID}: subject ${subject} >= ${min} of the rendered frame height at rest, build and hold (labels shown and hidden)`, async ({page}) => {
    test.setTimeout(400000);
    const {bad, stats} = await forAll(page, ID, `
      const out = [];
      const vb = svg.viewBox.baseVal; const m = svg.getScreenCTM();
      const FH = vb.height * Math.hypot(m.c, m.d);
      for (const u of arg.at) {
        x.seek(u * x.durationMs);
        for (const s of svg.querySelectorAll(arg.subject)) { if (eff(svg, s) < 0.3) continue; const hh = s.getBoundingClientRect().height / FH; stat('min subject h ' + ratio, Math.round(hh * 1000) / 1000); if (hh < arg.min) out.push(pr.name + ' ' + ratio + ' u=' + u + ': subject ' + hh.toFixed(3) + ' of the frame height'); }
      }
      return out;`, {subject, at, min}, {withHidden: true});
    report2(ID, 'subject (frame)', stats);
    expect(bad, bad.join('\n')).toEqual([]);
  });
}
