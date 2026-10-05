// LAW-0094 — Regla y excepción · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends at its element (checked while the parts
// separate, while the focus part is lifted and while they gather), the order does
// not change when seeking, and a relation is never drawn as causation by default.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';

// safe areas that turn the 16:9 test frame into the 1:1 / 9:16 content boxes (same content ratios)
const RATIOS = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.366, bottom: 0.2, left: 0.366}}};
// the final status tag never lies on a track piece (bed, sleepers, buffer stop, turnout board, lever),
// a plaque, a part or a caption; it stays inside the gathered board, beside the part that shows the state
const TAG_OK = 's.tag.shown && s.tag.offPieces && s.tag.offParts && s.tag.offCaptions && s.tag.inBoard && s.tag.gapToPart < 40';
const variants = [
  ...presetsFor('LAW-0094').map(pr => [pr.name, pr.params]),
  ['labels-key', {textVisibility: 'key'}],
];
const tagChecks = [
  ...variants.flatMap(([name, params]) => Object.entries(RATIOS).map(([shape, sa]) => ({at: 1, params: {...params, ...sa}, fn: TAG_OK, label: `status tag beside its track, off every piece and caption, inside the board (${name}, ${shape})`}))),
  ...Object.entries(RATIOS).map(([shape, sa]) => ({at: 1, params: {textVisibility: 'none', ...sa}, fn: '!s.tag.shown', label: `labels hidden: no status tag (${shape})`})),
];

// every caption sits beside its OWN link: it touches no other link, its leader never runs behind another
// caption, and no caption/label covers a prop (magnifier glass or handle, switch lever) — checked while the
// links are drawn, with the focus part lifted, mid-gather and at the hold, in every preset × ratio
const CAP_OK = 's.captions.onOtherLink.length === 0 && s.captions.leaderBehindCaption.length === 0 && s.captions.labelOnProp.length === 0';
const captionChecks = variants.flatMap(([name, params]) => Object.entries(RATIOS).flatMap(([shape, sa]) => [0.42, 0.62, 0.84, 1].map(at => ({
  at, params: {...params, ...sa}, fn: CAP_OK, label: `captions beside their own links, leaders clear of captions, labels off props (${name}, ${shape}, t=${at})`,
}))));
// key captions (relation captions, element labels, status tag, issue) stay >= 16 px in the 1080p frame
// (content-heavy layouts cap them at ~16 px so that the content text never reads smaller than they do)
const stress = presetsFor('LAW-0094').find(pr => pr.name === 'long-labels-stress').params;
const sizeChecks = Object.entries(RATIOS).flatMap(([shape, sa]) => [0.3, 0.62, 1].map(at => ({
  at, params: {...stress, ...sa}, fn: 's.keyPx1080 !== null && s.keyPx1080 >= 16', label: `long-labels: key captions >= 16 px at 1080p (${shape}, t=${at})`,
})));
// content text: rule, exception and condition plaques and the first fact >= 16 px at 1080p, the fact's
// second line >= 12 px — in every preset × ratio, spread out and at the gathered hold
const contentChecks = presetsFor('LAW-0094').flatMap(pr => Object.entries(RATIOS).flatMap(([shape, sa]) => [0.44, 0.84, 1].map(at => ({
  at, params: {...pr.params, ...sa}, fn: 's.contentPx1080 && s.contentPx1080.primaryPx >= 16 && s.contentPx1080.secondaryPx >= 12 && s.contentPx1080.primaryPx >= s.contentPx1080.maxGenericPx',
  label: `content text >= 16 px and never smaller than the generic captions/element labels (fact's second line >= 12 px) at 1080p (${pr.name}, ${shape}, t=${at})`,
}))));

contractSuite('LAW-0094', {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: 's.explode === 0 && s.relationsDrawn.every(p => p === 0) && !s.tracerVisible && s.blade === 0 && s.glass === 0', label: 'assembled: parts together, no link, no tracer, switch straight'},
    {at: 0.18, fn: 's.explode === 1 && s.separated > 20 && s.relationsDrawn.every(p => p === 0)', label: 'separate: every part apart from the others before any link is drawn'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p === 1) && s.relationsDrawn.some(p => p < 1)', label: 'links are drawn one by one'},
    {at: 0.3, fn: 's.relationsDrawn.every((p, i) => i === 0 || p === 0 || s.relationsDrawn[i - 1] === 1)', label: 'a later link never starts before the previous one is complete'},
    {at: 0.44, fn: 's.relationsDrawn.every(p => p === 1) && s.blade === 0 && s.socketLit === 0 && s.linkEnds.every(Boolean)', label: 'all supplied links drawn (each on its parts’ edges) before any part changes state'},
    {at: 0.62, fn: 's.focusScale > 1.2 && s.linkEnds.every(Boolean)', label: 'the lifted focus part keeps its links attached to its (enlarged) edges'},
    {at: 0.83, fn: 's.gather > 0 && s.gather < 1 && s.linkEnds.every(Boolean)', label: 'links stay attached while the parts gather'},
    {at: 1, fn: 's.linkEnds.every(Boolean) && s.linkLengths.every(v => v > 60)', label: 'every connector starts and ends on its own element and keeps a readable length'},
    {at: 1, fn: "s.causalCount === 0 && JSON.stringify(s.linkKinds) === JSON.stringify(['relation', 'relation', 'sequence', 'relation', 'sequence']) && JSON.stringify(s.arrowheads) === JSON.stringify([false, false, true, false, true])", label: 'relations carry no arrowhead and nothing is causal by default'},
    {at: 0.6, fn: "s.tracerVisible && s.visited.length >= 2 && JSON.stringify(s.visited) === JSON.stringify(s.visitOrder.slice(0, s.visited.length))", label: 'the tracer visits parts in the supplied order'},
    {at: 0.55, fn: "s.blade === 0 && !s.visited.includes('connector')", label: 'the switch only moves once the tracer reaches it (seek-stable order)'},
    {at: 0.62, fn: "s.focus === 'connector' && s.focusScale > 1 && Math.abs(s.focusU - 0.62) < 0.03", label: 'the focus element is enlarged while the tracer is on it'},
    {at: 1, fn: "!s.tracerVisible && s.focusScale === 1 && s.gather === 1 && s.blade === 1 && s.gate === 1 && s.litBranch === 1 && s.socketLit === 1 && s.glass === 1 && JSON.stringify(s.visitOrder) === JSON.stringify(['fact', 'lens', 'condition', 'connector', 'exception'])", label: 'gather: origin, thrown switch and the supplied state stay visible'},
    {at: 1, fn: 's.camera >= 1 && Object.values(s.gatherPull).some(v => v > 0)', label: 'gather: the parts slide back toward each other (the mechanism is re-assembled on one board)'},
    {at: 1, params: {routeState: 'main-as-supplied', traversalOrder: ['fact', 'lens', 'condition', 'connector', 'rule']}, fn: "s.blade === 0 && s.gate === 0 && s.litMain === 1 && s.litBranch === 0 && s.socketLit === 0 && s.marker === 'absent'", label: 'main-as-supplied: the switch stays straight and the main track lights'},
    {at: 0.6, params: {traversalOrder: ['exception', 'connector', 'fact']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['exception', 'connector', 'fact'])", label: 'the tracer follows a different supplied traversal order'},
    {at: 0.62, params: {focusElement: 'lens', traversalOrder: ['lens', 'fact', 'lens', 'condition']}, fn: "s.focus === 'lens'", label: 'the focus element is configurable'},
    {at: 1, params: {relationships: [{from: 'condition', to: 'connector', kind: 'causal'}, {from: 'lens', to: 'fact', kind: 'relation'}]}, fn: "s.causalCount === 1 && s.arrowheads[0] === true && s.arrowheads[1] === false && s.linkEnds.every(Boolean)", label: 'a causal style appears only when the author supplies it'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.blade === 1 && s.litBranch === 1 && s.relationsDrawn.every(p => p === 1)', label: 'labels hidden: the same mechanism and states are shown'},
    ...tagChecks,
    ...captionChecks,
    ...sizeChecks,
    ...contentChecks,
  ],
});

// AUTHORING item 14: every supplied editable text field is drawn and readable at the final hold —
// facts, the three rule texts, every issue, every assumption (with the "as supplied · no conclusion
// drawn" note), every element label and the caption of every supplied relationship kind — checked in
// the rendered SVG (visible <text> only, never truncated) for every preset × real 16:9, 9:16 and 1:1 frame.
test.describe('LAW-0094 supplied fields', () => {
  test('every supplied editable field is visible at the hold in every preset × ratio', async ({page}) => {
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0094')];
    const out = await page.evaluate(async presets => {
      const def = await window.__lib.load('LAW-0094');
      const norm = s => String(s).toLowerCase().replace(/\s+/g, '');
      const shown = el => {
        for (let n = el; n && n.tagName !== 'svg'; n = n.parentNode) {
          const op = n.getAttribute && n.getAttribute('opacity');
          if (op !== null && op !== undefined && parseFloat(op) < 0.5) return false;
          if (n.getAttribute && n.getAttribute('display') === 'none') return false;
        }
        const b = el.getBBox();
        return b.width > 0 && b.height > 0;
      };
      const rows = [];
      for (const pr of presets) {
        for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: pr.params});
          await x.ready;
          x.seek(x.durationMs);
          const p = x.getState({bounds: false}).params;
          const texts = [...x.element.querySelectorAll('text')].filter(shown);
          const hay = texts.map(t => norm([...t.childNodes].filter(c => c.nodeName !== 'title').map(c => c.textContent).join(' '))).join('|');
          const truncated = texts.filter(t => t.querySelector('title')).map(t => t.querySelector('title').textContent);
          const kinds = [...new Set(p.relationships.filter(r => r.from !== r.to).map(r => r.label || p.relationLabels[r.kind] || r.kind))];
          const fields = [...p.facts, p.rules.general, p.rules.exception, p.rules.condition, ...p.issues, ...p.assumptions, ...p.elements.map(e => e.label), ...kinds];
          const missing = fields.filter(f => !hay.includes(norm(f)));
          const note = hay.includes(norm('no conclusion drawn')) || hay.includes(norm('sin conclusión'));
          rows.push({preset: pr.name, ratio, missing, truncated, note});
          x.destroy();
          el.remove();
        }
      }
      return rows;
    }, presets);
    for (const r of out) {
      expect.soft(r.missing, `${r.preset} ${r.ratio}: supplied fields not visible at the hold`).toEqual([]);
      expect.soft(r.truncated, `${r.preset} ${r.ratio}: truncated texts at the hold`).toEqual([]);
      expect.soft(r.note, `${r.preset} ${r.ratio}: "as supplied · no conclusion drawn" note at the hold`).toBe(true);
    }
  });
});
