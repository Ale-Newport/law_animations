// LAW-0146 — Delegación normativa · mechanism. Contract battery + ID-specific checks encoding the
// brief's acceptanceCheck: every connector ends on its element, the traversal order does not change
// under seeking, and a relation is never drawn as causation by default.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {wordBreakSuite} from './delegacion-normativa-words.js';

const SHAPES = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.366, bottom: 0.2, left: 0.366}}};
const variants = [['default', {}], ...presetsFor('LAW-0146').map(pr => [pr.name, pr.params]), ['labels-hidden', {textVisibility: 'none'}]];
const each = (times, fn, label) => variants.flatMap(([name, params]) => Object.entries(SHAPES).flatMap(([shape, sa]) => times.map(at => ({
  at, params: {...params, ...sa}, fn, label: `${label} (${name}, ${shape}, t=${at})`,
}))));

contractSuite('LAW-0146', {
  continuity: ['tracer'],
  semantic: [
    {at: 0.17, fn: 's.drawn.every(p => p === 0) && s.visited.length === 0', label: 'separate: no relationship is drawn before the elements are in place'},
    {at: 0.44, fn: 's.drawn.every(p => p === 1) && s.visited.length === 0 && s.cordShown && s.separation === 1', label: 'relate: every explicit relationship (the cord included) is drawn before the tracer starts'},
    {at: 0.6, fn: 's.visited.length > 0 && s.visited.every((id, i) => id === s.order[i])', label: 'the tracer visits the elements in the supplied order (prefix while running)'},
    {at: 0.5, fn: 's.focusScale === 1 && s.highlight.article === 0', label: 'the focus element enlarges only when the tracer reaches it'},
    {at: 1, fn: 'JSON.stringify(s.visited) === JSON.stringify(s.order) && s.focusScale > 1 && s.highlight.article === 1 && s.highlight.reference === 1 && s.stateShown && s.keyShown', label: 'gather: full order visited, focus enlarged, linked phrases marked, supplied state shown'},
    {at: 1, fn: "!s.kinds.includes('causal') && s.kinds.every((k, i) => s.arrows[i] === (k !== 'relation'))", label: 'no causal link by default; plain relations carry no arrowhead'},
    {at: 1, params: {relationships: [{from: 'reference', to: 'article', kind: 'causal', label: 'x'}, {from: 'document', to: 'article', kind: 'relation', label: 'y'}]}, fn: "s.kinds[0] === 'causal' && s.arrows[0] === true && s.arrows[1] === false && !s.cordShown && s.connectorsLand", label: 'a causal arrow appears only when the author supplies one (then drawn as a connector, not the cord)'},
    {at: 1, params: {focusElement: 'hierarchy', traversalOrder: ['hierarchy', 'document', 'article', 'reference']}, fn: "s.focus === 'hierarchy' && s.focusScale > 1 && JSON.stringify(s.visited) === JSON.stringify(['hierarchy', 'document', 'article', 'reference'])", label: 'focus element and traversal order follow the parameters'},
    {at: 1, params: {linkState: 'authorization-to-be-checked'}, fn: "s.linkState === 'authorization-to-be-checked' && s.stateShown", label: 'the supplied link state is shown as supplied'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.connectorsLand && s.focusScale > 1 && s.stateShown', label: 'the mechanism completes identically with labels hidden'},
    ...each([0.44, 0.6, 0.7, 1], 's.connectorsLand && s.anchorsLand', 'every connector ends on the edge of its own element (also while the focus enlarges)'),
    ...each([1], 's.elementsApart && s.labelsPlaced && s.captionsPlaced && s.tagClear', 'elements apart; every relation label and component caption placed; tag clear'),
    // review: links have real length; each relation label sits on or against its own connector; any
    // remaining leader crosses no element, label or other leader
    ...each([1], 's.connPx.every(v => v >= 30)', 'every connector has real length (>= 30 px at 1080p)'),
    ...each([1], 's.labelGapPx.every(v => v <= 40)', 'relation labels are seated on or against their own connector (<= 40 px)'),
    ...each([1], 's.leadersClear', 'no label leader crosses an element, another label or another leader'),
    ...each([0.5, 0.6, 0.7], 's.tracerOffText', 'the tracer runs on connectors and outlines, never across the slips\' wording'),
  ],
});

suppliedTextSuite('LAW-0146', {
  fields: 'return [...p.sources.flatMap(s => [s.id, s.title]), ...p.hierarchy.levels, p.hierarchy.caption, ...p.interpretations.flatMap(i => [i.by, i.text]), ...p.elements.map(e => e.label), ...p.relationships.map(q => q.label).filter(Boolean), ...[...new Set(p.relationships.map(q => q.kind))].map(k => p.relationLabels[k]), p.passages[1].phrase, p.passages[0].phrase];',
  content: 'return [...p.sources.flatMap(s => [s.title]), ...p.hierarchy.levels, ...p.interpretations.flatMap(i => [i.text]), ...p.elements.map(e => e.label), p.passages[1].phrase, p.passages[0].phrase];',
  // review: small print (legend, relation labels, ids, tag) is >= 16 px in every preset and ratio
  minAny: 16,
  // generic captions: kit key / headers / state labels, legend entries, annotations and supplied captions
  captions: 'const es = p.locale === "es"; const K = [es ? "Según lo aportado · sin conclusión" : "As supplied · no conclusion drawn", es ? "Lectura propuesta" : "Reading proposed", es ? "Jerarquía editable" : "Editable hierarchy", es ? "Habilitación aportada" : "Authorization supplied", es ? "Habilitación por comprobar" : "Authorization to be checked"]; return [...K, ...Object.values(p.relationLabels), ...p.relationships.map(q => q.label).filter(Boolean), p.hierarchy.caption];',
});

wordBreakSuite('LAW-0146');

// Review (rendered): at the hold, in every preset × ratio, the tag's string starts ON the cord (or the
// clip) it hangs from, and no connector line runs behind the tag's card.
test.describe('LAW-0146 tag on its cord (rendered)', () => {
  test('LAW-0146: the tag string starts on the cord; no connector runs behind the tag', async ({page}) => {
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0146'), {name: 'labels-hidden', params: {textVisibility: 'none'}}];
    const bad = await page.evaluate(async ([presets]) => {
      const def = await window.__lib.load('LAW-0146');
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
          const tag = `${pr.name} ${ratio}`;
          const pts = (path, n) => { const L = path.getTotalLength(), m = path.getScreenCTM(); return Array.from({length: n}, (_, i) => { const q = path.getPointAtLength(L * i / (n - 1)).matrixTransform(m); return toRoot(q.x, q.y); }); };
          const box = e => { const b = e.getBoundingClientRect(); const p0 = toRoot(b.left, b.top), p1 = toRoot(b.right, b.bottom); return {x: p0.x, y: p0.y, w: p1.x - p0.x, h: p1.y - p0.y}; };
          const str = nodeEl('m-tag-string'), cordC = nodeEl('m-cord-c'), clip = nodeEl('m-clip'), card = nodeEl('m-tag-card');
          if (!str || !cordC || !card) { el.remove(); continue; }
          const P = pts(str, 2)[0];
          const cp = pts(cordC, 200);
          const dCord = Math.min(...cp.map(q => Math.hypot(q.x - P.x, q.y - P.y))) * k;
          const cb = clip ? box(clip) : null;
          const onClip = cb && P.x >= cb.x - 2 && P.x <= cb.x + cb.w + 2 && P.y >= cb.y - 2 && P.y <= cb.y + cb.h + 2;
          if (dCord > 4 && !onClip) out.push(`${tag}: the tag string starts ${Math.round(dCord)} px from the cord`);
          const tb = box(card);
          for (const line of svg.querySelectorAll('[data-node$="-line"]')) {
            if (!/^rel\d+-line$/.test(line.getAttribute('data-node')) || !line.getAttribute('d')) continue;
            const hit = pts(line, 120).some(q => q.x > tb.x + 2 && q.x < tb.x + tb.w - 2 && q.y > tb.y + 2 && q.y < tb.y + tb.h - 2);
            if (hit) out.push(`${tag}: connector ${line.getAttribute('data-node')} runs behind the tag`);
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
